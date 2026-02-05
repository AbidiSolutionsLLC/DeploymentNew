const LeaveRequest = require("../models/leaveRequestSchema");
const User = require("../models/userSchema");
const TimeTracker = require("../models/timeTrackerSchema");
const { moment, TIMEZONE } = require("../utils/dateUtils");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");
const sendEmail = require("../utils/emailService");
const mongoose = require("mongoose");

// --- HELPER: GET FULL TEAM IDS (RECURSIVE) ---
const getTeamIds = async (managerId) => {
  let teamIds = [managerId.toString()];
  const directReports = await User.find({ reportsTo: managerId }).distinct("_id");

  if (directReports.length > 0) {
    for (const reportId of directReports) {
      const subTeam = await getTeamIds(reportId);
      teamIds = [...new Set([...teamIds, ...subTeam])];
    }
  }
  return teamIds;
};

// --- CREATE LEAVE REQUEST ---
const createLeaveRequest = async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) throw new NotFoundError("User not found");

  if (!leaveType || !startDate || !endDate) {
    throw new BadRequestError("Missing required fields");
  }

  const start = moment(startDate).tz(TIMEZONE).startOf("day");
  const end = moment(endDate).tz(TIMEZONE).startOf("day");
  const daysDiff = end.diff(start, "days") + 1;

  const userLeaveBalance = user.leaves[leaveType.toLowerCase()] || 0;
  if (userLeaveBalance < daysDiff) {
    throw new BadRequestError(`Not enough ${leaveType} leaves available`);
  }

  const existingLeaves = await LeaveRequest.find({
    employee: user._id,
    status: { $in: ["Pending", "Approved"] }
  });

  const overlappingLeaves = existingLeaves.filter(leave => {
    return (
      new Date(leave.startDate) <= new Date(endDate) &&
      new Date(startDate) <= new Date(leave.endDate)
    );
  });

  if (overlappingLeaves.length > 0) {
    throw new BadRequestError("Overlap detected with existing leave.");
  }

  const leaveRequest = new LeaveRequest({
    employee: user._id,
    employeeName: user.name,
    email: user.email,
    leaveType,
    startDate,
    endDate,
    reason
  });

  const savedLeaveRequest = await leaveRequest.save();

  await User.findByIdAndUpdate(user._id, {
    $push: {
      leaveHistory: {
        leaveId: savedLeaveRequest._id,
        leaveType,
        startDate: start,
        endDate: end,
        status: "Pending",
        daysTaken: daysDiff,
        reason
      }
    },
    $inc: {
      [`leaves.${leaveType.toLowerCase()}`]: -daysDiff,
      bookedLeaves: daysDiff,
      avalaibleLeaves: -daysDiff
    }
  });

  let curr = start.clone();
  const timeTrackerEntries = [];

  while (curr.isSameOrBefore(end)) {
    const date = curr.toDate();
    const existingEntry = await TimeTracker.findOne({ user: user._id, date });

    if (existingEntry) {
      existingEntry.status = "Leave";
      await existingEntry.save();
    } else {
      timeTrackerEntries.push({
        user: user._id,
        date,
        status: "Leave",
        notes: `Leave: ${leaveType} - ${reason || "No reason provided"}`
      });
    }
    curr.add(1, "day");
  }

  if (timeTrackerEntries.length > 0) {
    await TimeTracker.insertMany(timeTrackerEntries);
  }

  res.status(201).json({ success: true, data: savedLeaveRequest });
};

// --- GET LEAVE REQUESTS ---
const getLeaveRequests = async (req, res) => {
  const roleKey = req.user.role.replace(/\s+/g, "").toLowerCase();
  const currentUserId = req.user.id || req.user._id;
  let query = {};

  if (roleKey === "superadmin" || roleKey === "hr") {
    query = {};
  } else if (roleKey === "manager" || roleKey === "admin") {
    query.employee = { $in: await getTeamIds(currentUserId) };
  } else {
    query.employee = currentUserId;
  }

  if (req.query.employeeName) {
    query.employeeName = { $regex: req.query.employeeName, $options: "i" };
  }
  if (req.query.leaveType) query.leaveType = req.query.leaveType;
  if (req.query.status) query.status = req.query.status;

  const leaveRequests = await LeaveRequest.find(query).sort({ appliedAt: -1 });
  res.json({ success: true, data: leaveRequests });
};

// --- UPDATE LEAVE STATUS ---
const updateLeaveStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!["Pending", "Approved", "Rejected"].includes(status)) {
    throw new BadRequestError("Invalid status");
  }

  const leaveRequest = await LeaveRequest.findById(id);
  if (!leaveRequest) throw new NotFoundError("Leave request not found");

  const roleKey = req.user.role.replace(/\s+/g, "").toLowerCase();
  const currentUserId = req.user.id || req.user._id;

  if (!["superadmin", "admin", "hr"].includes(roleKey)) {
    throw new ForbiddenError("Managers have read-only access to leaves.");
  }

  if (
    roleKey === "admin" &&
    leaveRequest.employee.toString() === currentUserId.toString()
  ) {
    throw new ForbiddenError("You cannot approve your own leave.");
  }

  leaveRequest.status = status;
  await leaveRequest.save();

  if (leaveRequest.email) {
    sendEmail(
      leaveRequest.email,
      `Leave Request ${status}`,
      `<p>Your leave request has been <strong>${status}</strong>.</p>`
    ).catch(console.error);
  }

  res.json({ success: true, data: leaveRequest });
};

// --- MANAGE HOLIDAYS ---
const manageHolidays = async (req, res) => {
  const roleKey = req.user.role.replace(/\s+/g, "").toLowerCase();

  if (!["superadmin", "admin", "hr"].includes(roleKey)) {
    throw new ForbiddenError("Permission Denied");
  }

  res.json({ success: true, message: "Holiday list updated." });
};

// --- BASIC CRUD ---
const getLeaveRequestById = async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) throw new NotFoundError("Leave request");
  res.json({ success: true, data: leave });
};

const updateLeaveRequest = async (req, res) => {
  const leave = await LeaveRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!leave) throw new NotFoundError("Leave request");
  res.json({ success: true, data: leave });
};

const deleteLeaveRequest = async (req, res) => {
  const leave = await LeaveRequest.findByIdAndDelete(req.params.id);
  if (!leave) throw new NotFoundError("Leave request");
  res.json({ success: true, message: "Leave request deleted" });
};

module.exports = {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  deleteLeaveRequest,
  updateLeaveStatus,
  manageHolidays
};
