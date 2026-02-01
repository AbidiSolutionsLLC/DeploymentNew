const User = require("../models/userSchema");
const Project = require("../models/projectSchema");
const Department = require("../models/departemt");
const Ticket = require("../models/ticketManagementSchema");
const Log = require("../models/LogSchema");
const TimeTracker = require("../models/timeTrackerSchema");
const LeaveRequest = require("../models/leaveRequestSchema");
const Timesheet = require("../models/timesheetSchema");
const Holiday = require("../models/holidaySchema");
const catchAsync = require("../utils/catchAsync");

exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const { role, _id } = req.user;
  
  // Date Helpers for "Today" queries
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  // --- RBAC Scoping Logic ---
  let userQuery = { empStatus: "Active" };
  let ticketQuery = { status: { $ne: "Closed" } };
  let leaveQuery = { status: "Pending" };
  let timesheetQuery = { status: "Pending" };

  // 1. HR Specific: See All People/Attendance, but NO Tickets
  if (role === 'HR') {
    ticketQuery = { _id: null }; // Force 0 tickets for HR 
    // Leaves and Users remain global for HR "All" access 
  } 
  
  // 2. Admin & Manager: Scope to Subordinates
  else if (role === 'Admin' || role === 'Manager') {
    const directReports = await User.find({ reportsTo: _id }).distinct('_id');
    const indirectReports = await User.find({ reportsTo: { $in: directReports } }).distinct('_id');
    const fullTeam = [...directReports, ...indirectReports, _id];

    userQuery = { _id: { $in: fullTeam }, empStatus: "Active" };
    leaveQuery = { employee: { $in: fullTeam }, status: "Pending" };
    timesheetQuery = { user: { $in: fullTeam }, status: "Pending" };
    // Tickets: Managers see subordinates' tickets if they are also Techs (handled in rbac.js)
    ticketQuery = { closedBy: { $in: fullTeam }, status: { $ne: "Closed" } };
  }

  // Execute all queries in parallel
  const [
    totalUsers,
    totalProjects,
    pendingLeaves,
    pendingTimesheets,
    openTickets,
    todayAttendance,
    upcomingHoliday,
    departmentCounts,
    projectStatusCounts,
    recentLogs
  ] = await Promise.all([
    User.countDocuments(userQuery),
    Project.countDocuments({ status: { $ne: "Cancelled" } }),
    LeaveRequest.countDocuments(leaveQuery),
    Timesheet.countDocuments(timesheetQuery),
    Ticket.countDocuments(ticketQuery),

    // Attendance stats - Always global for HR and Super Admin 
    TimeTracker.aggregate([
      { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),

    Holiday.findOne({ date: { $gte: todayStart } }).sort({ date: 1 }).select("holidayName date day"),

    Department.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "department",
          as: "employees"
        }
      },
      { $project: { name: 1, count: { $size: "$employees" } } }
    ]),

    Project.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),

    Log.find().sort({ createdAt: -1 }).limit(5).lean()
  ]);

  // Process Attendance Data
  const attendanceMap = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
  todayAttendance.forEach(item => {
    if (attendanceMap[item._id] !== undefined) attendanceMap[item._id] = item.count;
  });
  
  // HR & Super Admin see company-wide absence; others see team absence
  const totalEmployeesForAttendance = role === 'HR' || role === 'Super Admin' 
    ? await User.countDocuments({ empStatus: "Active" }) 
    : totalUsers;

  attendanceMap.Absent = Math.max(0, totalEmployeesForAttendance - (attendanceMap.Present + attendanceMap.Leave));

  res.status(200).json({
    status: "success",
    data: {
      summary: {
        totalEmployees: totalUsers,
        activeProjects: totalProjects,
        pendingApprovals: pendingLeaves + (role === 'HR' ? 0 : pendingTimesheets), // HR has "own" for timesheets 
        openTickets: openTickets
      },
      attendance: attendanceMap,
      actionItems: {
        leaves: pendingLeaves,
        timesheets: role === 'HR' ? 0 : pendingTimesheets,
        tickets: openTickets
      },
      holiday: upcomingHoliday,
      charts: {
        projects: {
          labels: projectStatusCounts.map(p => p._id),
          data: projectStatusCounts.map(p => p.count)
        },
        departments: {
          labels: departmentCounts.map(d => d.name),
          data: departmentCounts.map(d => d.count)
        }
      },
      logs: recentLogs.map(l => ({
        message: l.message,
        time: new Date(l.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        level: l.level
      }))
    }
  });
});