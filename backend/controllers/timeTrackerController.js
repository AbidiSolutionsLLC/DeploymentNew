const TimeTracker = require("../models/timeTrackerSchema");
const catchAsync = require("../utils/catchAsync");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../utils/ExpressError");
const { getSearchScope } = require("../utils/rbac"); 
const { getStartOfESTDay } = require("../utils/dateUtils");

const isWeekend = (date) => {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
};

// --- GET ALL LOGS (Read Access) ---
exports.getAllTimeLogs = catchAsync(async (req, res) => {
  // REQUIREMENT: Admin and HR now see ALL logs via getSearchScope.
  const scope = await getSearchScope(req.user, 'attendance');

  const logs = await TimeTracker.find(scope)
    .populate('user', 'name email designation department avatar empID')
    .sort({ date: -1 });

  res.status(200).json(logs);
});

// Alias for compatibility with different route versions
exports.getAllTimeTrackers = exports.getAllTimeLogs;

// --- UPDATE TIME LOG (Write/Edit Access) ---
exports.updateTimeLog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  // 1. SECURITY: Only Super Admin can edit attendance manually.
  const roleKey = role ? role.trim() : "";
  if (roleKey !== 'Super Admin') {
    throw new ForbiddenError("Access Denied. Only Super Admins can edit attendance records.");
  }

  let updates = { ...req.body };

  // 2. Smart Calculation Logic (Consolidated)
  if (updates.checkInTime && updates.checkOutTime) {
    const start = new Date(updates.checkInTime);
    const end = new Date(updates.checkOutTime);
    const diffMs = end - start;
    
    // Only auto-calculate hours if they weren't explicitly provided in the request
    if (updates.totalHours === undefined) {
        updates.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    // REQUIREMENT FIX: If Super Admin manually provided a status (Present/Absent), respect it.
    // Only auto-calculate status if the 'status' field was NOT sent in the request body.
    if (!updates.status) {
      if (updates.totalHours >= 8) updates.status = "Present";
      else if (updates.totalHours >= 4.5) updates.status = "Half Day";
      else updates.status = "Absent";
    }
  }

  // 3. Database Update
  const log = await TimeTracker.findByIdAndUpdate(id, updates, { 
    new: true,
    runValidators: true 
  }).populate('user', 'name email');

  if (!log) throw new NotFoundError("Attendance record not found");
  
  res.status(200).json(log);
});

// --- PERSONAL ACTIONS ---

exports.getMyTimeLogs = catchAsync(async (req, res) => {
  const logs = await TimeTracker.find({ user: req.user.id }).sort({ date: -1 });
  res.status(200).json(logs);
});

exports.checkIn = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const todayStart = getStartOfESTDay(now);

  // Strict Weekend Block
  if (isWeekend(now)) {
    return res.status(403).json({
      message: "Check-in is not allowed on weekends."
    });
  }

  // Duplicate Check
  const existingLogForToday = await TimeTracker.findOne({
    user: userId,
    date: todayStart
  });

  if (existingLogForToday) {
    return res.status(400).json({
      message: "You have already checked in for today."
    });
  }

  // Handle Abandoned Sessions
  const abandonedSession = await TimeTracker.findOne({
    user: userId,
    checkOutTime: { $exists: false }
  });

  let previousSessionMsg = "";

  if (abandonedSession) {
    abandonedSession.checkOutTime = now;
    abandonedSession.autoCheckedOut = true;
    abandonedSession.status = "Absent"; 
    abandonedSession.notes = (abandonedSession.notes || "") + " | System closed during next check-in";

    await abandonedSession.save();
    previousSessionMsg = "Note: Your previous open session was closed and marked Absent. ";
  }

  // Create New Session
  const newLog = await TimeTracker.create({
    user: userId,
    date: todayStart,
    checkInTime: now,
    status: 'Present' 
  });

  res.status(200).json({
    message: `${previousSessionMsg}Checked in successfully.`,
    log: newLog
  });
});

exports.checkOut = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const currentLog = await TimeTracker.findOne({
    user: userId,
    checkOutTime: { $exists: false }
  });

  if (!currentLog) {
    throw new BadRequestError("No active check-in found.");
  }

  const now = new Date();
  currentLog.checkOutTime = now;

  const totalMs = currentLog.checkOutTime - new Date(currentLog.checkInTime);
  const totalHours = parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));

  currentLog.totalHours = totalHours;

  if (totalHours >= 8) { 
    currentLog.status = "Present";
  } else if (totalHours >= 4.5) { 
    currentLog.status = "Half Day";
  } else {
    currentLog.status = "Absent";
  }

  await currentLog.save();

  res.status(200).json({
    message: "Checked out successfully",
    log: currentLog
  });
});

exports.getDailyLog = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const todayStart = getStartOfESTDay();

  const log = await TimeTracker.findOne({
    user: userId,
    date: todayStart
  });

  if (!log) {
    return res.status(200).json({ message: "No log found for today", log: null });
  }

  res.status(200).json({ log });
});

exports.getMonthlyAttendance = catchAsync(async (req, res) => {
  const { month, year } = req.params;
  const userId = req.user.id;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const attendance = await TimeTracker.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  res.status(200).json(attendance);
});

// --- ADMIN / CRUD ---

exports.createTimeLog = catchAsync(async (req, res) => {
  const newLog = await TimeTracker.create(req.body);
  res.status(201).json(newLog);
});

exports.getTimeLogById = catchAsync(async (req, res) => {
  const log = await TimeTracker.findById(req.params.id).populate('user');
  if (!log) throw new NotFoundError("Time log not found");
  res.status(200).json(log);
});

exports.deleteTimeLog = catchAsync(async (req, res) => {
  if (req.user.role !== 'Super Admin') {
    throw new ForbiddenError("Access Denied. Only Super Admin can delete records.");
  }
  
  const log = await TimeTracker.findByIdAndDelete(req.params.id);
  if (!log) throw new NotFoundError("Time log not found");
  res.status(200).json({ message: "Deleted successfully" });
});