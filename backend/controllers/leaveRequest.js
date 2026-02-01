const LeaveRequest = require("../models/leaveRequestSchema");
const User = require("../models/userSchema");
const TimeTracker = require("../models/timeTrackerSchema");
const catchAsync = require("../utils/catchAsync");
const { moment, TIMEZONE } = require("../utils/dateUtils");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");
const sendEmail = require('../utils/emailService');
const { getSearchScope } = require("../utils/rbac");

// --- CREATE LEAVE REQUEST ---
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

  // Time Tracker Logic (Mark future dates as Leave)
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

// --- GET LEAVES (Using RBAC) ---
exports.getLeaveRequests = catchAsync(async (req, res) => {
  const rbacFilter = await getSearchScope(req.user, 'leave');
  const query = { ...rbacFilter };

  if (req.query.employeeName) query.employeeName = req.query.employeeName;
  if (req.query.leaveType) query.leaveType = req.query.leaveType;
  if (req.query.status) query.status = req.query.status;

  const leaveRequests = await LeaveRequest.find(query).sort({ appliedAt: -1 });
  res.json({ success: true, data: leaveRequests });
});

// --- APPROVE / REJECT LEAVE ---
exports.updateLeaveStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  
  if (!["Pending", "Approved", "Rejected"].includes(status)) throw new BadRequestError("Invalid status");

  const leaveRequest = await LeaveRequest.findById(id);
  if (!leaveRequest) throw new NotFoundError("Leave request not found");

  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
  
  // FIX: Allow Super Admin to approve their own leave
  if (leaveRequest.employee.toString() === req.user.id && roleKey !== 'superadmin') {
     throw new ForbiddenError("You cannot update the status of your own leave request.");
  }

  // Admin/Manager restricted to subordinates. HR/Super Admin allowed globally.
  if (roleKey === 'admin' || roleKey === 'manager') {
     const employee = await User.findById(leaveRequest.employee);
     if (employee.reportsTo?.toString() !== req.user.id) {
        throw new ForbiddenError("You can only approve leaves for your direct subordinates.");
     }
  } else if (roleKey !== 'superadmin' && roleKey !== 'hr') {
     throw new ForbiddenError("Permission denied.");
  }

  const start = moment(leaveRequest.startDate).tz(TIMEZONE).startOf('day');
  const end = moment(leaveRequest.endDate).tz(TIMEZONE).startOf('day');
  const daysDiff = end.diff(start, 'days') + 1;

  const updateObj = { $set: { "leaveHistory.$[elem].status": status } };

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

  if (leaveRequest.email) {
    const emailSubject = `Leave Request ${status}`;
    const emailBody = `<p>Your leave request has been <strong>${status}</strong>.</p>`;
    sendEmail(leaveRequest.email, emailSubject, emailBody).catch(console.error);
  }

  res.status(200).json({ success: true, message: `Leave status updated to ${status}`, data: leaveRequest });
});

exports.getLeaveRequestById = catchAsync(async (req, res) => {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) throw new NotFoundError("Leave request");
    res.json({ success: true, data: leaveRequest });
});

exports.updateLeaveRequest = catchAsync(async (req, res) => {
    const leaveRequest = await LeaveRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!leaveRequest) throw new NotFoundError("Leave request");
    res.json({ success: true, data: leaveRequest });
});

exports.deleteLeaveRequest = catchAsync(async (req, res) => {
    const leaveRequest = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!leaveRequest) throw new NotFoundError("Leave request");
    res.json({ success: true, message: "Leave request deleted" });
});