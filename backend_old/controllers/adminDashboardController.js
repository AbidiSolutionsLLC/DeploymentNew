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
  // Date Helpers for "Today" queries
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  // Execute all queries in parallel for speed
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
    // 1. Core Counts
    User.countDocuments({ empStatus: "Active" }),
    Project.countDocuments({ status: { $ne: "Cancelled" } }),
    
    // 2. Action Items (Things needing Admin attention)
    LeaveRequest.countDocuments({ status: "Pending" }),
    Timesheet.countDocuments({ status: "Pending" }),
    Ticket.countDocuments({ status: { $ne: "Closed" } }),

    // 3. Today's Attendance Stats
    TimeTracker.aggregate([
      { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),

    // 4. Next Upcoming Holiday
    Holiday.findOne({ date: { $gte: todayStart } }).sort({ date: 1 }).select("holidayName date day"),

    // 5. Demographics (Users per Department)
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

    // 6. Project Health
    Project.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),

    // 7. Recent System Logs
    Log.find().sort({ createdAt: -1 }).limit(5).lean()
  ]);

  // Process Attendance Data
  const attendanceMap = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
  todayAttendance.forEach(item => {
    if (attendanceMap[item._id] !== undefined) attendanceMap[item._id] = item.count;
  });
  // Calculate absent based on total users vs checked in (approximate)
  attendanceMap.Absent = totalUsers - (attendanceMap.Present + attendanceMap.Leave);

  res.status(200).json({
    status: "success",
    data: {
      summary: {
        totalEmployees: totalUsers,
        activeProjects: totalProjects,
        pendingApprovals: pendingLeaves + pendingTimesheets,
        openTickets: openTickets
      },
      attendance: attendanceMap,
      actionItems: {
        leaves: pendingLeaves,
        timesheets: pendingTimesheets,
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