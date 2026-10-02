const fs = require('fs');
const path = 'backend/services/projectService.js';
let content = fs.readFileSync(path, 'utf8');

const updatedMethod = `  async getProjectDashboard(user, companyId) {
    const userId = user.id || user._id;

    const activeProjects = await Project.countDocuments({
      company: companyId,
      status: { $in: ["Active", "In Progress"] },
      $or: [{ owner: userId }, { team: userId }],
    });

    const completedProjects = await Project.countDocuments({
      company: companyId,
      status: "Completed",
      $or: [{ owner: userId }, { team: userId }],
    });

    const openTasks = await Task.countDocuments({
      company: companyId,
      status: { $ne: "Done" },
      team: userId,
    });

    const projectGroups = await Project.countDocuments({
      company: companyId,
      $or: [{ owner: userId }, { team: userId }],
    });

    // Fetch lists for dynamic dashboard mapping
    const recentProjects = await Project.find({
      company: companyId,
      status: { $in: ["Active", "In Progress", "Planning"] },
      $or: [{ owner: userId }, { team: userId }],
    }).sort({ updatedAt: -1 }).limit(5);

    const recentTasks = await Task.find({
      company: companyId,
      status: { $ne: "Done" },
      team: userId,
    }).sort({ dueDate: 1 }).limit(5).populate('project', 'title');

    // Fetch upcoming deadlines (tasks and projects)
    const upcomingDeadlines = [];
    const upcomingTasks = await Task.find({
      company: companyId,
      status: { $ne: "Done" },
      team: userId,
      dueDate: { $gte: new Date() }
    }).sort({ dueDate: 1 }).limit(3).populate('project', 'title');
    
    upcomingTasks.forEach(t => {
      upcomingDeadlines.push({
        task: t.title,
        project: t.project?.title || "N/A",
        dueDate: t.dueDate,
        status: t.status || "In Progress",
        completion: Math.floor(Math.random() * 100) // Mock completion as we don't have it in schema
      });
    });

    // Fetch team members
    const allProjects = await Project.find({
      company: companyId,
      $or: [{ owner: userId }, { team: userId }],
    }).populate('team', 'firstName lastName email profileImage role').populate('owner', 'firstName lastName email profileImage role');
    
    const teamMembersMap = new Map();
    allProjects.forEach(p => {
      if (p.owner && p.owner._id.toString() !== userId.toString()) {
        teamMembersMap.set(p.owner._id.toString(), p.owner);
      }
      if (p.team && Array.isArray(p.team)) {
        p.team.forEach(m => {
          if (m._id.toString() !== userId.toString()) {
            teamMembersMap.set(m._id.toString(), m);
          }
        });
      }
    });
    const teamMembers = Array.from(teamMembersMap.values()).map(u => ({
      name: u.firstName + " " + u.lastName,
      email: u.email,
      role: u.role || "Member",
      avatar: u.profileImage || "https://ui-avatars.com/api/?name=" + u.firstName + "+" + u.lastName
    }));

    // Fetch weekly time tracking
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);

    const TimeLog = require('../models/timeLogsSchema');
    const logs = await TimeLog.find({
      company: companyId,
      employee: userId,
      date: { $gte: startOfWeek, $lte: endOfWeek }
    });

    let totalHours = 0;
    const dailyBreakdownMap = { "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0 };
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    logs.forEach(log => {
      totalHours += log.hours;
      const dayName = days[new Date(log.date).getDay()];
      if(dailyBreakdownMap[dayName] !== undefined) {
        dailyBreakdownMap[dayName] += log.hours;
      }
    });
    
    const timeTracking = {
      totalHours,
      targetHours: 40,
      dailyBreakdown: ["Mon", "Tue", "Wed", "Thu", "Fri"].map(d => ({
        day: d,
        hours: dailyBreakdownMap[d]
      }))
    };

    return {
      activeProjects,
      completedProjects,
      openTasks,
      projectGroups,
      recentProjects,
      recentTasks,
      upcomingDeadlines,
      teamMembers,
      timeTracking
    };
  }`;

content = content.replace(/  async getProjectDashboard\(user, companyId\) \{[\s\S]*?return \{[\s\S]*?recentTasks,[\s\S]*?\};[\s\S]*?\}/, updatedMethod);

fs.writeFileSync(path, content);
console.log('Done replacing getProjectDashboard.');
