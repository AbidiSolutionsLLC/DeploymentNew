const mongoose = require("mongoose");
const User = require("../models/userSchema");
const Project = require("../models/projectSchema");
const Department = require("../models/department");
const Ticket = require("../models/ticketManagementSchema");
const Log = require("../models/LogSchema");
const TimeTracker = require("../models/timeTrackerSchema");
const LeaveRequest = require("../models/leaveRequestSchema");
const Timesheet = require("../models/timesheetSchema");
const Holiday = require("../models/holidaySchema");

class AdminDashboardService {
  async getDashboardStats(user, companyId) {
    const role = user.role;
    const _id = user.id || user._id;

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    let userQuery = { empStatus: "Active", company: companyId };
    let ticketQuery = { status: { $ne: "Closed" }, company: companyId };
    let leaveQuery = { status: "Pending", company: companyId };
    let timesheetQuery = { status: "Pending", company: companyId };
    let attendanceQuery = { date: { $gte: todayStart, $lte: todayEnd }, company: companyId };
    let projectQuery = { status: { $ne: "Cancelled" }, company: companyId };
    let projectAggregateMatch = { company: companyId };
    let fullTeam = null;

    if (role === 'HR') {
      ticketQuery = { _id: null, company: companyId }; 
    }
    else if (role === 'Manager') {
      const directReports = await User.find({ reportsTo: _id }).distinct('_id');
      const indirectReports = await User.find({ reportsTo: { $in: directReports } }).distinct('_id');
      const rawTeam = [...directReports, ...indirectReports, _id];
      fullTeam = rawTeam.map(id => new mongoose.Types.ObjectId(id));

      userQuery = { _id: { $in: fullTeam }, empStatus: "Active", company: companyId };
      leaveQuery = { employee: { $in: fullTeam }, status: "Pending", company: companyId };
      timesheetQuery = { user: { $in: fullTeam }, status: "Pending", company: companyId };
      attendanceQuery = { user: { $in: fullTeam }, date: { $gte: todayStart, $lte: todayEnd }, company: companyId };
      ticketQuery = { closedBy: { $in: fullTeam }, status: { $ne: "Closed" }, company: companyId };
      projectQuery = { status: { $ne: "Cancelled" }, $or: [{ owner: { $in: fullTeam } }, { team: { $in: fullTeam } }], company: companyId };
      projectAggregateMatch = { $or: [{ owner: { $in: fullTeam } }, { team: { $in: fullTeam } }], company: companyId };
    }

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
      Project.countDocuments(projectQuery),
      LeaveRequest.countDocuments(leaveQuery),
      Timesheet.countDocuments(timesheetQuery),
      Ticket.countDocuments(ticketQuery),

      TimeTracker.aggregate([
        { $match: attendanceQuery },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),

      Holiday.findOne({ date: { $gte: todayStart }, company: companyId }).sort({ date: 1 }).select("holidayName date day"),

      Department.aggregate([
        { $match: { company: companyId } },
        {
          $lookup: {
            from: "users",
            let: { deptId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$department", "$$deptId"] },
                  ...(fullTeam ? { _id: { $in: fullTeam } } : {})
                }
              }
            ],
            as: "employees"
          }
        },
        { $project: { name: 1, count: { $size: "$employees" } } },
        { $match: fullTeam ? { count: { $gt: 0 } } : {} }
      ]),

      Project.aggregate([
        { $match: projectAggregateMatch },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),

      Log.find({ company: companyId }).sort({ createdAt: -1 }).limit(5).lean()
    ]);

    const attendanceMap = { Present: 0, Absent: 0, Late: 0, Leave: 0 };

    todayAttendance.forEach(item => {
      if (attendanceMap[item._id] !== undefined) attendanceMap[item._id] = item.count;
    });

    attendanceMap.Absent = Math.max(0, totalUsers - (attendanceMap.Present + attendanceMap.Leave));

    return {
      summary: {
        totalEmployees: totalUsers,
        activeProjects: totalProjects,
        pendingApprovals: pendingLeaves + (role === 'HR' ? 0 : pendingTimesheets), 
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
        time: new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        level: l.level
      }))
    };
  }
}

module.exports = new AdminDashboardService();
