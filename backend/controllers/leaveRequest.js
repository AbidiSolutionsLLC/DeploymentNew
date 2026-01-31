const LeaveRequest = require("../models/leaveRequestSchema");
const User = require("../models/userSchema");
const TimeTracker = require("../models/timeTrackerSchema");
const catchAsync = require("../utils/catchAsync");
const { moment, TIMEZONE } = require("../utils/dateUtils");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");
const sendEmail = require('../utils/emailService');
const { getSearchScope } = require("../utils/rbac"); // <--- Import RBAC

// Create Leave Request
exports.createLeaveRequest = catchAsync(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw new NotFoundError("User not found");

  if (!leaveType || !startDate || !endDate) throw new BadRequestError("Missing required fields");

  const start = moment(startDate).tz(TIMEZONE).startOf('day');
  const end = moment(endDate).tz(TIMEZONE).startOf('day');
  const daysDiff = end.diff(start, 'days') + 1;

  const userLeaveBalance = user.leaves[leaveType.toLowerCase()] || 0;
  if (userLeaveBalance < daysDiff) throw new BadRequestError(`Not enough ${leaveType} leaves available`);

  const existingLeaves = await LeaveRequest.find({
    employee: user._id,
    status: { $in: ["Pending", "Approved"] }
  });

  const overlappingLeaves = existingLeaves.filter(leave => {
    const existingStart = new Date(leave.startDate);
    const existingEnd = new Date(leave.endDate);
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    return (existingStart <= newEnd && newStart <= existingEnd);
  });

  if (overlappingLeaves.length > 0) throw new BadRequestError(`Overlap detected with existing leave.`);

  const leaveRequest = new LeaveRequest({
    employee: user._id,
    employeeName: user.name,
    email: user.email,
    leaveType,
    startDate,
    endDate,
    reason,
  });

  const savedLeaveRequest = await leaveRequest.save();

  // Update Balances
  const updateObj = {
    $push: {
      leaveHistory: {
        leaveId: savedLeaveRequest._id,
        leaveType,
        startDate: start,
        endDate: end,
        status: 'Pending',
        daysTaken: daysDiff,
        reason: reason
      }
    },
    $inc: {
      [`leaves.${leaveType.toLowerCase()}`]: -daysDiff,
      bookedLeaves: daysDiff,
      avalaibleLeaves: -daysDiff
    }
  };

  await User.findByIdAndUpdate(user._id, updateObj);

  // Time Tracker Logic
  const timeTrackerEntries = [];
  const curr = start.clone();
  while (curr.isSameOrBefore(end)) {
    const dateStart = curr.toDate();
    const existingEntry = await TimeTracker.findOne({ user: user._id, date: dateStart });
    if (existingEntry) {
      existingEntry.status = 'Leave';
      await existingEntry.save();
    } else {
      timeTrackerEntries.push({
        user: user._id,
        date: dateStart,
        status: 'Leave',
        notes: `Leave: ${leaveType} - ${reason || 'No reason provided'}`
      });
    }
    curr.add(1, 'days');
  }
  if (timeTrackerEntries.length > 0) await TimeTracker.insertMany(timeTrackerEntries);

  res.status(201).json({ success: true, data: savedLeaveRequest });
});

// --- FIXED: GET LEAVES (Using RBAC) ---
exports.getLeaveRequests = catchAsync(async (req, res) => {
  // 1. Get RBAC Scope (Handles SuperAdmin, Manager, Admin, Employee)
  const rbacFilter = await getSearchScope(req.user, 'leave');
  
  const query = { ...rbacFilter };

  // 2. Add Filters
  if (req.query.employeeName) query.employeeName = req.query.employeeName;
  if (req.query.leaveType) query.leaveType = req.query.leaveType;
  if (req.query.status) query.status = req.query.status;

  const leaveRequests = await LeaveRequest.find(query).sort({ appliedAt: -1 });
  res.json({ success: true, data: leaveRequests });
});

exports.getLeaveRequestById = catchAsync(async (req, res) => {
  const leaveRequest = await LeaveRequest.findById(req.params.id);
  if (!leaveRequest) throw new NotFoundError("Leave request");
  res.json({ success: true, data: leaveRequest });
});

exports.updateLeaveRequest = catchAsync(async (req, res) => {
  // Only allow if user owns it or has permission (Simplified for now)
  const leaveRequest = await LeaveRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!leaveRequest) throw new NotFoundError("Leave request");
  res.json({ success: true, data: leaveRequest });
});

exports.deleteLeaveRequest = catchAsync(async (req, res) => {
  const leaveRequest = await LeaveRequest.findByIdAndDelete(req.params.id);
  if (!leaveRequest) throw new NotFoundError("Leave request");
  res.json({ success: true, message: "Leave request deleted" });
});

// --- APPROVE / REJECT LEAVE ---
exports.updateLeaveStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  
  if (!["Pending", "Approved", "Rejected"].includes(status)) throw new BadRequestError("Invalid status");

  const leaveRequest = await LeaveRequest.findById(id);
  if (!leaveRequest) throw new NotFoundError("Leave request not found");

  // --- RBAC: Permission Check ---
  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
  
  // 1. Employee cannot approve own leave
  if (leaveRequest.employee.toString() === req.user.id) {
     throw new ForbiddenError("You cannot update the status of your own leave request.");
  }

  // 2. Manager/Admin Restriction
  if (roleKey === 'admin' || roleKey === 'manager') {
     const employee = await User.findById(leaveRequest.employee);
     // Must be a subordinate
     if (employee.reportsTo?.toString() !== req.user.id) {
        // Strict check: Only direct subordinates for approval action
        throw new ForbiddenError("You can only approve leaves for your direct subordinates.");
     }
  } else if (roleKey !== 'superadmin' && roleKey !== 'hr') {
     throw new ForbiddenError("Permission denied.");
  }
  // -----------------------------

  const start = moment(leaveRequest.startDate).tz(TIMEZONE).startOf('day');
  const end = moment(leaveRequest.endDate).tz(TIMEZONE).startOf('day');
  const daysDiff = end.diff(start, 'days') + 1;

  const updateObj = { $set: { "leaveHistory.$[elem].status": status } };

  // Re-calculate Balances (If Rejected/Re-Approved)
  const oldStatus = leaveRequest.status;
  if (status === "Rejected" && oldStatus !== "Rejected") {
    // Refund leaves
    updateObj.$inc = {
      [`leaves.${leaveRequest.leaveType.toLowerCase()}`]: daysDiff,
      bookedLeaves: -daysDiff,
      avalaibleLeaves: daysDiff
    };
  } else if (status === "Approved" && oldStatus === "Rejected") {
    // Deduct again
    updateObj.$inc = {
      [`leaves.${leaveRequest.leaveType.toLowerCase()}`]: -daysDiff,
      bookedLeaves: daysDiff,
      avalaibleLeaves: -daysDiff
    };
  }

  await User.findByIdAndUpdate(leaveRequest.employee, updateObj, {
    arrayFilters: [{ "elem.leaveId": leaveRequest._id }]
  });

  leaveRequest.status = status;
  await leaveRequest.save();

  // Email Notification
  if (leaveRequest.email) {
    const emailSubject = `Leave Request ${status}`;
    const emailBody = `<p>Your leave request has been <strong>${status}</strong>.</p>`;
    sendEmail(leaveRequest.email, emailSubject, emailBody).catch(console.error);
  }

  res.status(200).json({ success: true, message: `Leave status updated to ${status}`, data: leaveRequest });
});