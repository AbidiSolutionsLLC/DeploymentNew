const TimeTracker = require("../models/timeTrackerSchema");
const User = require("../models/userSchema");
const LeaveRequest = require("../models/leaveRequestSchema");
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

// --- 1. GET ALL LOGS (List View - Keeps Team Logic) ---
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
  const roleKey = role ? role.replace(/\s+/g, '').toLowerCase() : "";

  if (roleKey !== 'superadmin') {
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

  if (updates.checkInTime) {
      updates.date = getStartOfESTDay(updates.checkInTime);
  } else if (updates.date) {
      updates.date = getStartOfESTDay(updates.date);
  }

  const log = await TimeTracker.findByIdAndUpdate(id, updates, { 
    new: true,
    runValidators: true 
  }).populate('user', 'name email');

  if (!log) throw new NotFoundError("Attendance record not found");
  res.status(200).json(log);
});

// --- 3. GET MONTHLY ATTENDANCE (FIXED: STRICT PERSONAL) ---
exports.getMonthlyAttendance = catchAsync(async (req, res) => {
  const { month, year } = req.params;
  const { id, role } = req.user;
  const { userId } = req.query; // Allow viewing specific user if requested

  const startDate = moment.tz([year, month - 1], TIMEZONE).startOf('month').toDate();
  const endDate = moment.tz([year, month - 1], TIMEZONE).endOf('month').toDate();

  let query = { date: { $gte: startDate, $lte: endDate } };
  const roleKey = role ? role.replace(/\s+/g, '').toLowerCase() : "";

  // LOGIC FIX:
  // If a specific userId is requested AND requester is Admin/Manager, show that user.
  // Otherwise, ALWAYS default to the logged-in user's personal attendance.
  // This prevents Admins/Managers from receiving the whole team's data on their personal calendar.
  
  if (userId && ['superadmin', 'admin', 'manager', 'hr'].includes(roleKey)) {
     query.user = userId;
  } else {
     query.user = id; // Strict Personal Scope
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

  // 1. Check if user already has an OPEN session (forgot to check out)
  const abandonedSession = await TimeTracker.findOne({ 
    user: userId, 
    checkOutTime: { $exists: false } 
  });

  let previousSessionMsg = "";

  if (abandonedSession) {
    // Check if the open session belongs to TODAY
    const isSameDay = abandonedSession.date.getTime() === todayStartEST.getTime();

    if (isSameDay) {
      // It's the same day. They are genuinely checked in already.
      return res.status(400).json({ message: "You already have an active session for today. Please check out instead." });
    } else {
      // It's a lingering session from a PREVIOUS day. Force close it.
      // We mark them 'Absent' to match the penalty rule in your cronjob.
      abandonedSession.checkOutTime = nowEST.toDate();
      abandonedSession.autoCheckedOut = true;
      abandonedSession.totalHours = 12; 
      abandonedSession.status = "Absent"; 
      abandonedSession.notes = (abandonedSession.notes || "") + " | Auto-closed (Forgot to checkout previous day)";
      
      await abandonedSession.save();
      previousSessionMsg = "Your previous open session was auto-closed as 'Absent'. ";
    }
  }

  // 2. Check if they already completed a FULL session today
  const existingLogForToday = await TimeTracker.findOne({ user: userId, date: todayStartEST });
  if (existingLogForToday) {
    return res.status(400).json({ message: "You have already completed your check-in for today (EST)." });
  }

  // 3. Create the new Check-In
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
  const role = req.user.role ? req.user.role.replace(/\s+/g, '').toLowerCase() : "";
  if (req.body.user && !['superadmin', 'admin'].includes(role)) {
      req.body.user = req.user.id;
  } else if (!req.body.user) {
      req.body.user = req.user.id;
  }
  
  if (req.body.checkInTime) {
      req.body.date = getStartOfESTDay(req.body.checkInTime);
  } else if (req.body.date) {
      req.body.date = getStartOfESTDay(req.body.date);
  } else {
      req.body.date = getStartOfESTDay();
  }

  if (req.body.checkInTime && req.body.checkOutTime) {
      const start = moment(req.body.checkInTime).tz(TIMEZONE);
      const end = moment(req.body.checkOutTime).tz(TIMEZONE);
      const duration = moment.duration(end.diff(start));
      if (req.body.totalHours === undefined) {
          req.body.totalHours = parseFloat(duration.asHours().toFixed(2));
      }
      if (!req.body.status) {
          if (req.body.totalHours >= 8) req.body.status = "Present";
          else if (req.body.totalHours >= 4.5) req.body.status = "Half Day";
          else req.body.status = "Absent";
      }
  }

  const newLog = await TimeTracker.create(req.body);
  res.status(201).json(newLog);
});

exports.getTimeLogById = catchAsync(async (req, res) => {
  const log = await TimeTracker.findById(req.params.id).populate('user');
  if (!log) throw new NotFoundError("Time log not found");
  res.status(200).json(log);
});

// --- 4. GET ADMIN ATTENDANCE SUMMARY (NEW) ---
exports.getAdminAttendanceSummary = catchAsync(async (req, res) => {
  const { date } = req.query;
  const targetDateMoment = date ? moment.tz(date, TIMEZONE) : getCurrentESTTime();
  const targetDateStart = targetDateMoment.clone().startOf('day').toDate();
  const targetDateEnd = targetDateMoment.clone().endOf('day').toDate();
  const targetDateStr = targetDateMoment.format('YYYY-MM-DD');

  const { id } = req.user;
  
  // 1. Get scope for users
  const scope = await getSearchScope(req.user, 'attendance');
  
  // Normalize scope for users (getSearchScope returns {user: ...} or {})
  let userQuery = {};
  if (scope.user) {
    userQuery._id = scope.user;
  } else if (scope._id === null) {
    return res.status(200).json({ present: [], absent: [], onLeave: [], counts: { present: 0, absent: 0, onLeave: 0, total: 0 } });
  }

  // 2. Fetch all relevant users in scope (exclude Super Admin if necessary based on your policy, usually they are included)
  const usersInScope = await User.find(userQuery).select('name email designation department avatar empID');
  const userIds = usersInScope.map(u => u._id.toString());

  // 3. Fetch TimeTracker logs for the specific date
  const timeLogs = await TimeTracker.find({
    user: { $in: userIds },
    date: targetDateStart
  }).populate('user', 'name email designation department avatar empID');

  const presentUserIds = timeLogs.map(log => log.user._id.toString());

  // 4. Fetch Approved Leaves for the date
  // We need to find leaves where targetDate is between startDate and endDate (inclusive)
  // Note: startDate/endDate in LeaveRequest are currently Strings (YYYY-MM-DD)
  const approvedLeaves = await LeaveRequest.find({
    employee: { $in: userIds },
    status: 'Approved',
    startDate: { $lte: targetDateStr },
    endDate: { $gte: targetDateStr }
  }).populate('employee', 'name email designation department avatar empID');

  const onLeaveUserIds = approvedLeaves.map(leave => leave.employee._id.toString());

  // 5. Categorize
  const present = timeLogs.filter(log => log.status !== 'Leave'); // Only actual presence records
  const onLeave = approvedLeaves.map(leave => ({
      user: leave.employee,
      status: 'On Leave',
      leaveType: leave.leaveType,
      date: targetDateStart
  }));

  const absentUserIds = userIds.filter(id => !presentUserIds.includes(id) && !onLeaveUserIds.includes(id));
  const absentUsers = usersInScope.filter(u => absentUserIds.includes(u._id.toString())).map(u => ({
      user: u,
      status: 'Absent',
      date: targetDateStart
  }));

  res.status(200).json({
    present,
    onLeave,
    absent: absentUsers,
    counts: {
      present: present.length,
      onLeave: onLeave.length,
      absent: absentUsers.length,
      total: usersInScope.length
    }
  });
});

// --- CRITICAL ALIASES TO FIX "UNDEFINED" ROUTE ERRORS ---
exports.getAllTimeTrackers = exports.getAllTimeLogs;
exports.createTimeTracker = exports.createTimeLog;
exports.updateTimeTracker = exports.updateTimeLog;
exports.checkin = exports.checkIn; // Lowercase alias
exports.checkout = exports.checkOut; // Lowercase alias