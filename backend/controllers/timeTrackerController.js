const TimeTracker = require("../models/timeTrackerSchema");
const User = require("../models/userSchema");
const catchAsync = require("../utils/catchAsync");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../utils/ExpressError");
const { getSearchScope } = require("../utils/rbac"); 
const { 
    getStartOfESTDay, 
    getCurrentESTTime, 
    isESTWeekend, 
    TIMEZONE 
} = require("../utils/dateUtils");
const moment = require("moment-timezone");

// --- HELPER: GET FULL TEAM IDS (RECURSIVE) ---
const getTeamIds = async (managerId) => {
  let teamIds = [managerId.toString()];
  const directReports = await User.find({ reportsTo: managerId }).distinct('_id');
  if (directReports.length > 0) {
    const stringReports = directReports.map(id => id.toString());
    teamIds = [...teamIds, ...stringReports];
    for (const reportId of directReports) {
      const subTeam = await getTeamIds(reportId);
      teamIds = [...new Set([...teamIds, ...subTeam])];
    }
  }
  return teamIds;
};

// --- 1. GET ALL LOGS ---
exports.getAllTimeLogs = catchAsync(async (req, res) => {
  const { id, role } = req.user;
  const roleKey = role ? role.replace(/\s+/g, '').toLowerCase() : "";
  let query = {};

  if (roleKey === 'manager') {
    const myFullTeam = await getTeamIds(id);
    query.user = { $in: myFullTeam };
  } else {
    const scope = await getSearchScope(req.user, 'attendance');
    Object.assign(query, scope);
  }

  const logs = await TimeTracker.find(query)
    .populate('user', 'name email designation department avatar empID')
    .sort({ date: -1 });

  res.status(200).json(logs);
});

// --- 2. UPDATE TIME LOG (ADMIN EDIT) ---
exports.updateTimeLog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== 'Super Admin') {
    throw new ForbiddenError("Access Denied. Only Super Admins can edit attendance records.");
  }

  let updates = { ...req.body };

  if (updates.checkInTime && updates.checkOutTime) {
    const start = moment(updates.checkInTime).tz(TIMEZONE);
    const end = moment(updates.checkOutTime).tz(TIMEZONE);
    const duration = moment.duration(end.diff(start));
    
    if (updates.totalHours === undefined) {
        updates.totalHours = parseFloat(duration.asHours().toFixed(2));
    }

    if (!updates.status) {
      if (updates.totalHours >= 8) updates.status = "Present";
      else if (updates.totalHours >= 4.5) updates.status = "Half Day";
      else updates.status = "Absent";
    }
  }

  const log = await TimeTracker.findByIdAndUpdate(id, updates, { 
    new: true,
    runValidators: true 
  }).populate('user', 'name email');

  if (!log) throw new NotFoundError("Attendance record not found");
  res.status(200).json(log);
});

// --- 3. GET MONTHLY ATTENDANCE ---
exports.getMonthlyAttendance = catchAsync(async (req, res) => {
  const { month, year } = req.params;
  const { id, role } = req.user;
  
  const startDate = moment.tz([year, month - 1], TIMEZONE).startOf('month').toDate();
  const endDate = moment.tz([year, month - 1], TIMEZONE).endOf('month').toDate();

  let query = { date: { $gte: startDate, $lte: endDate } };
  const roleKey = role ? role.replace(/\s+/g, '').toLowerCase() : "";

  if (roleKey === 'manager') {
    const myFullTeamIds = await getTeamIds(id);
    query.user = { $in: myFullTeamIds };
  } else if (!['superadmin', 'admin', 'hr'].includes(roleKey)) {
    query.user = id;
  }

  const attendance = await TimeTracker.find(query)
    .populate('user', 'name designation avatar department')
    .sort({ date: 1 });

  res.status(200).json(attendance);
});

// --- PERSONAL ACTIONS ---

exports.checkIn = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const nowEST = getCurrentESTTime();
  const todayStartEST = getStartOfESTDay(nowEST.toDate());

  if (isESTWeekend(nowEST.toDate())) {
    return res.status(403).json({ message: "Check-in is not allowed on weekends (EST)." });
  }

  // Auto-Checkout Logic (12-Hour Rule)
  const abandonedSession = await TimeTracker.findOne({ 
    user: userId, 
    checkOutTime: { $exists: false } 
  });

  let previousSessionMsg = "";

  if (abandonedSession) {
    const sessionStart = moment(abandonedSession.checkInTime).tz(TIMEZONE);
    const hoursElapsed = nowEST.diff(sessionStart, 'hours');

    if (hoursElapsed >= 12) {
      abandonedSession.checkOutTime = nowEST.toDate(); 
      abandonedSession.totalHours = 9; 
      abandonedSession.status = "Present"; 
      abandonedSession.notes = (abandonedSession.notes || "") + " | Auto-checked out (12h rule)";
      await abandonedSession.save();
      previousSessionMsg = "Your previous open session was auto-closed as 'Present'. ";
    } else {
      return res.status(400).json({ message: "You already have an active session." });
    }
  }

  const existingLogForToday = await TimeTracker.findOne({ user: userId, date: todayStartEST });
  if (existingLogForToday) {
    return res.status(400).json({ message: "You have already checked in for today (EST)." });
  }

  const newLog = await TimeTracker.create({ 
    user: userId, 
    date: todayStartEST, 
    checkInTime: nowEST.toDate(), 
    status: 'Present' 
  });

  res.status(200).json({ message: `${previousSessionMsg}Checked in successfully.`, log: newLog });
});

exports.checkOut = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const nowEST = getCurrentESTTime();

  const currentLog = await TimeTracker.findOne({ 
    user: userId, 
    checkOutTime: { $exists: false } 
  }).sort({ checkInTime: -1 });

  if (!currentLog) throw new BadRequestError("No active check-in found.");

  const checkInMoment = moment(currentLog.checkInTime).tz(TIMEZONE);
  if (!checkInMoment.isValid()) {
    await TimeTracker.findByIdAndDelete(currentLog._id);
    throw new BadRequestError("Corrupted check-in data. Session cleared.");
  }

  currentLog.checkOutTime = nowEST.toDate();
  const duration = moment.duration(nowEST.diff(checkInMoment));
  let totalHours = parseFloat(duration.asHours().toFixed(2));

  if (isNaN(totalHours)) totalHours = 0;
  currentLog.totalHours = totalHours;

  if (totalHours >= 8) currentLog.status = "Present";
  else if (totalHours >= 4.5) currentLog.status = "Half Day";
  else currentLog.status = "Absent";

  await currentLog.save();
  res.status(200).json({ message: "Checked out successfully", log: currentLog });
});

exports.getMyTimeLogs = catchAsync(async (req, res) => {
  const logs = await TimeTracker.find({ user: req.user.id }).sort({ date: -1 });
  res.status(200).json(logs);
});

exports.getDailyLog = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const todayStart = getStartOfESTDay();
  const log = await TimeTracker.findOne({ user: userId, date: todayStart });
  if (!log) return res.status(200).json({ message: "No log found for today", log: null });
  res.status(200).json({ log });
});

exports.deleteTimeLog = catchAsync(async (req, res) => {
  if (req.user.role !== 'Super Admin') {
    throw new ForbiddenError("Access Denied. Only Super Admin can delete records.");
  }
  const log = await TimeTracker.findByIdAndDelete(req.params.id);
  if (!log) throw new NotFoundError("Time log not found");
  res.status(200).json({ message: "Deleted successfully" });
});

exports.createTimeLog = catchAsync(async (req, res) => {
  const newLog = await TimeTracker.create(req.body);
  res.status(201).json(newLog);
});

exports.getTimeLogById = catchAsync(async (req, res) => {
  const log = await TimeTracker.findById(req.params.id).populate('user');
  if (!log) throw new NotFoundError("Time log not found");
  res.status(200).json(log);
});

// --- CRITICAL ALIASES TO FIX "UNDEFINED" ROUTE ERRORS ---
exports.getAllTimeTrackers = exports.getAllTimeLogs;
exports.createTimeTracker = exports.createTimeLog;
exports.updateTimeTracker = exports.updateTimeLog;
exports.checkin = exports.checkIn; // Lowercase alias
exports.checkout = exports.checkOut; // Lowercase alias
