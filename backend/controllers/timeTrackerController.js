const TimeTracker = require("../models/timeTrackerSchema");
const catchAsync = require("../utils/catchAsync");
const { NotFoundError, BadRequestError } = require("../utils/ExpressError");
const { getSearchScope } = require("../utils/rbac"); 
const { getStartOfESTDay } = require("../utils/dateUtils");

const isWeekend = (date) => {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
};

// --- GET ALL LOGS (Read Access) ---
exports.getAllTimeTrackers = catchAsync(async (req, res) => {
  // RBAC handles the logic:
  // SuperAdmin/Admin/HR -> Returns {} (All)
  // Manager -> Returns { user: { $in: team } }
  // Others -> Returns { user: me }
  const scope = await getSearchScope(req.user, 'attendance');

  const logs = await TimeTracker.find(scope)
    .populate('user', 'name email designation department avatar empID')
    .sort({ date: -1 });

  res.status(200).json(logs);
});

// --- UPDATE TIME LOG (Write/Edit Access) ---
exports.updateTimeLog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // STRICT SECURITY: Only Super Admin can edit attendance manually
  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
  
  if (roleKey !== 'superadmin') {
      throw new ForbiddenError("Only Super Admins can edit attendance records.");
  }

  const log = await TimeTracker.findByIdAndUpdate(id, updates, { new: true });
  if (!log) throw new NotFoundError("Log not found");
  
  res.status(200).json(log);
});

// ... (Keep getMyTimeLogs, CheckIn, CheckOut, getTodayStatus as they were) ...
exports.getMyTimeLogs = catchAsync(async (req, res) => {
  const logs = await TimeTracker.find({ user: req.user.id }).sort({ date: -1 });
  res.status(200).json(logs);
});

// 1. Check-In
exports.checkIn = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const todayStart = getStartOfESTDay(now);

  // 1. Strict Weekend Block
  if (isWeekend(now)) {
    return res.status(403).json({
      message: "Check-in is not allowed on weekends."
    });
  }

  // 2. DUPLICATE CHECK (The Fix)
  const existingLogForToday = await TimeTracker.findOne({
    user: userId,
    date: todayStart
  });

  if (existingLogForToday) {
    return res.status(400).json({
      message: "You have already checked in for today. Multiple check-ins are not allowed."
    });
  }

  const abandonedSession = await TimeTracker.findOne({
    user: userId,
    checkOutTime: { $exists: false }
  });

  let previousSessionMsg = "";

  if (abandonedSession) {
    abandonedSession.checkOutTime = now;
    abandonedSession.autoCheckedOut = true;
    abandonedSession.status = "Absent"; // Penalty for forgetting
    abandonedSession.notes = (abandonedSession.notes || "") + " | System closed during next check-in";

    await abandonedSession.save();
    previousSessionMsg = "Note: Your previous open session was closed and marked Absent. ";
  }

  // 4. Create New Session
  const newLog = await TimeTracker.create({
    user: userId,
    date: todayStart,
    checkInTime: now,
    status: 'Present' // Default status
  });

  res.status(200).json({
    message: `${previousSessionMsg}Checked in successfully.`,
    log: newLog
  });
});

// 2. Check-Out (FIXED LOGIC HERE)
exports.checkOut = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Find the active session
  const currentLog = await TimeTracker.findOne({
    user: userId,
    checkOutTime: { $exists: false }
  });

  if (!currentLog) {
    throw new BadRequestError("No active check-in found.");
  }

  // Calculate Times
  const now = new Date();
  currentLog.checkOutTime = now;

  const totalMs = currentLog.checkOutTime - new Date(currentLog.checkInTime);
  const totalHours = parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));

  currentLog.totalHours = totalHours;

  // Determine Status Based on Total Hours
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

// 3. Get Today's Status (For UI State)
exports.getDailyLog = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const todayStart = getStartOfESTDay();

  // Find log created TODAY
  const log = await TimeTracker.findOne({
    user: userId,
    date: todayStart
  });

  if (!log) {
    return res.status(200).json({ message: "No log found for today", log: null });
  }

  res.status(200).json({ log });
});

// 4. Get Monthly History
exports.getMonthlyAttendance = catchAsync(async (req, res) => {
  const { month, year } = req.params;
  const userId = req.user.id;

  // Calculate start and end of month
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

// --- FIXED: Single getAllTimeLogs with RBAC ---
exports.getAllTimeLogs = catchAsync(async (req, res) => {
  // 1. Calculate Scope
  const scope = await getSearchScope(req.user, 'attendance');

  // 2. Query
  const logs = await TimeTracker.find(scope).populate('user');
  res.status(200).json(logs);
});

exports.getTimeLogById = catchAsync(async (req, res) => {
  const log = await TimeTracker.findById(req.params.id).populate('user');
  if (!log) throw new NotFoundError("Time log not found");
  res.status(200).json(log);
});

// --- FIXED: Security Lock for Updates ---
exports.updateTimeLog = catchAsync(async (req, res) => {
  // 1. SECURITY: Only Super Admin can edit
  if (req.user.role !== 'Super Admin') {
    return res.status(403).json({ message: "Access Denied. Only Super Admin can edit attendance." });
  }

  // 2. Smart Update Logic (Auto-calculate Status)
  let updates = { ...req.body };
  if (updates.checkInTime && updates.checkOutTime) {
    const start = new Date(updates.checkInTime);
    const end = new Date(updates.checkOutTime);
    const diffMs = end - start;
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    updates.totalHours = totalHours;

    if (totalHours >= 8) updates.status = "Present";
    else if (totalHours >= 4) updates.status = "Half Day";
    else updates.status = "Absent";
  }

  const log = await TimeTracker.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!log) throw new NotFoundError("Time log not found");
  res.status(200).json(log);
});

exports.deleteTimeLog = catchAsync(async (req, res) => {
  const log = await TimeTracker.findByIdAndDelete(req.params.id);
  if (!log) throw new NotFoundError("Time log not found");
  res.status(200).json({ message: "Deleted successfully" });
});
