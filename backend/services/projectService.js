const Project = require("../models/projectSchema");
const Task = require("../models/taskSchema");
const ProjectGroup = require("../models/projectGroupSchema");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../utils/ExpressError");
const { createNotification } = require('../utils/notificationService');

class ProjectService {
  async createProject(user, companyId, data) {
    const { title, description, team, strict, isPublic, startDate, dueDate, owner: dataOwner, department, status } = data;
    const owner = dataOwner || user.id || user._id;

    const project = new Project({
      title,
      description,
      team,
      owner,
      department,
      status,
      strict,
      isPublic,
      startDate,
      dueDate,
      company: companyId,
    });

    const savedProject = await project.save();

    if (savedProject.team && savedProject.team.length > 0) {
      savedProject.team.forEach(memberId => {
        createNotification({
          recipient: memberId,
          type: 'PROJECT_CREATED',
          title: 'New Project Assignment',
          message: `A new project "${savedProject.title}" has been created and you are assigned to it.`,
          relatedEntity: { entityType: 'project', entityId: savedProject._id },
        }).catch(err => console.error('Notification failed:', err));
      });
    }

    return savedProject;
  }

  // Progress rule (single definition, used everywhere):
  // progress = average completionPercent across the project's tasks.
  // Projects without tasks get NO entry, so the UI can show its documented status-based estimate.
  async getProjectProgressMap(projectIds, companyId) {
    const map = new Map();
    if (!projectIds || projectIds.length === 0) return map;

    const tasks = await Task.find({ company: companyId, project: { $in: projectIds } })
      .select("project completionPercent");

    const sums = new Map();
    const counts = new Map();
    tasks.forEach((t) => {
      if (!t.project) return;
      const key = t.project.toString();
      sums.set(key, (sums.get(key) || 0) + (t.completionPercent || 0));
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    sums.forEach((sum, key) => map.set(key, Math.round(sum / counts.get(key))));
    return map;
  }

  async getAllProjects(user, companyId, query) {
    const { page = 1, limit = 20, search = '', status, myProjects } = query;
    const skip = (page - 1) * limit;

    const userId = user.id || user._id;

    const filter = {
      company: companyId,
      ...(status && { status }),
      ...(search && {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }),
      ...(myProjects === 'true' && {
        $or: [{ owner: userId }, { team: userId }],
      })
    };

    const [data, total] = await Promise.all([
      Project.find(filter)
        .populate("team", "name email avatar")
        .populate("owner", "name email avatar")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Project.countDocuments(filter)
    ]);

    const progressMap = await this.getProjectProgressMap(
      data.map((p) => p._id),
      companyId
    );

    return {
      data: data.map((p) => {
        const project = p.toObject();
        const progress = progressMap.get(project._id.toString());
        if (progress !== undefined) project.progress = progress;
        return project;
      }),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getProjectById(user, companyId, projectId) {
    const project = await Project.findOne({ _id: projectId, company: companyId })
      .populate("team", "name email avatar")
      .populate("owner", "name email avatar");

    if (!project) throw new NotFoundError("Project");

    const userRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = userRole === 'admin';
    const isManagerTech = userRole === 'manager' && user.isTechnician;
    const isOwner = project.owner && project.owner._id ? project.owner._id.toString() === (user.id || user._id).toString() : project.owner?.toString() === (user.id || user._id).toString();
    const isTeamMember = project.team.some(member => {
        return member && member._id ? member._id.toString() === (user.id || user._id).toString() : member.toString() === (user.id || user._id).toString();
    });
    
    if (!isSuperAdmin && !isAdmin && !isManagerTech && !isOwner && !isTeamMember) {
      throw new ForbiddenError("You do not have permission to access or modify this project.");
    }

    return project;
  }

  async updateProject(user, companyId, projectId, data) {
    const { title, description, team, status, strict, isPublic, startDate, dueDate, owner, department } = data;

    const project = await Project.findOne({ _id: projectId, company: companyId });
    if (!project) throw new NotFoundError("Project");

    const userRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = userRole === 'admin';
    const isManagerTech = userRole === 'manager' && user.isTechnician;
    const isOwner = project.owner && project.owner._id ? project.owner._id.toString() === (user.id || user._id).toString() : project.owner?.toString() === (user.id || user._id).toString();
    const isTeamMember = project.team.some(member => {
        return member && member._id ? member._id.toString() === (user.id || user._id).toString() : member.toString() === (user.id || user._id).toString();
    });
    
    if (!isSuperAdmin && !isAdmin && !isManagerTech && !isOwner && !isTeamMember) {
      throw new ForbiddenError("You do not have permission to access or modify this project.");
    }

    const previousTeam = project.team.map(id => id.toString());
    const previousStatus = project.status;

    project.title = title || project.title;
    // Allow clearing optional fields (undefined = leave untouched, null/"" = clear)
    project.description = description !== undefined ? description : project.description;
    project.team = team || project.team;
    project.status = status || project.status;
    project.strict = strict !== undefined ? strict : project.strict;
    project.isPublic = isPublic !== undefined ? isPublic : project.isPublic;
    project.startDate = startDate !== undefined ? startDate : project.startDate;
    project.dueDate = dueDate !== undefined ? dueDate : project.dueDate;
    project.owner = owner || project.owner;
    project.department = department || project.department;

    const updatedProject = await project.save();

    if (team && team.length > 0) {
      const newMembers = team.filter(id => !previousTeam.includes(id.toString()));
      newMembers.forEach(memberId => {
        createNotification({
          recipient: memberId,
          type: 'PROJECT_MEMBER_ADDED',
          title: 'Added to Project',
          message: `You have been added to the project "${updatedProject.title}".`,
          relatedEntity: { entityType: 'project', entityId: updatedProject._id },
        }).catch(err => console.error('Notification failed:', err));
      });
    }

    if (status && status !== previousStatus) {
      const recipients = [...new Set([...updatedProject.team.map(id => id.toString()), updatedProject.owner.toString()])];
      recipients.forEach(memberId => {
        createNotification({
          recipient: memberId,
          type: 'PROJECT_STATUS_UPDATED',
          title: 'Project Status Updated',
          message: `Project "${updatedProject.title}" is now marked as ${status}.`,
          relatedEntity: { entityType: 'project', entityId: updatedProject._id },
        }).catch(err => console.error('Notification failed:', err));
      });
    }

    return updatedProject;
  }

  async deleteProject(user, companyId, projectId) {
    const project = await Project.findOne({ _id: projectId, company: companyId });
    if (!project) throw new NotFoundError("Project");

    const userRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = userRole === 'admin';
    const isManagerTech = userRole === 'manager' && user.isTechnician;
    const isOwner = project.owner && project.owner._id ? project.owner._id.toString() === (user.id || user._id).toString() : project.owner?.toString() === (user.id || user._id).toString();
    const isTeamMember = project.team.some(member => {
        return member && member._id ? member._id.toString() === (user.id || user._id).toString() : member.toString() === (user.id || user._id).toString();
    });
    
    if (!isSuperAdmin && !isAdmin && !isManagerTech && !isOwner && !isTeamMember) {
      throw new ForbiddenError("You do not have permission to access or modify this project.");
    }

    const tasksCount = await Task.countDocuments({ project: project._id, company: companyId });
    if (tasksCount > 0) {
      throw new BadRequestError("Cannot delete project with associated tasks");
    }

    const recipients = [...new Set([...project.team.map(id => id.toString()), project.owner.toString()])];
    recipients.forEach(memberId => {
      createNotification({
        recipient: memberId,
        type: 'PROJECT_DELETED',
        title: 'Project Deleted',
        message: `Project "${project.title}" has been deleted or archived.`,
        relatedEntity: { entityType: 'project', entityId: project._id },
      }).catch(err => console.error('Notification failed:', err));
    });

    await project.deleteOne();
  }

  async getUserProjects(user, companyId) {
    const userId = user.id || user._id;

    return Project.find({
      company: companyId,
      $or: [{ owner: userId }, { team: userId }],
    })
      .populate("team", "name email avatar")
      .populate("owner", "name email avatar");
  }

  async getProjectDashboard(user, companyId) {
    const userId = user.id || user._id;

    const activeProjects = await Project.countDocuments({
      company: companyId,
      status: "Active",
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

    // "Project Groups" must count ProjectGroup documents (was: count of projects)
    const projectGroups = await ProjectGroup.countDocuments({ company: companyId });

    // Fetch lists for dynamic dashboard mapping
    const recentProjects = await Project.find({
      company: companyId,
      status: { $in: ["Active", "Planning"] },
      $or: [{ owner: userId }, { team: userId }],
    }).sort({ updatedAt: -1 }).limit(5);

    const recentProgress = await this.getProjectProgressMap(
      recentProjects.map((p) => p._id),
      companyId
    );
    const recentProjectsWithProgress = recentProjects.map((p) => {
      const project = p.toObject();
      const progress = recentProgress.get(project._id.toString());
      if (progress !== undefined) project.progress = progress;
      return project;
    });

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
        status: t.status || "Todo",
        completion: t.completionPercent || 0
      });
    });

    // Fetch team members
    const allProjects = await Project.find({
      company: companyId,
      $or: [{ owner: userId }, { team: userId }],
    }).populate('team', 'name email avatar role').populate('owner', 'name email avatar role');
    
    const teamMembersMap = new Map();
    allProjects.forEach(p => {
      if (p.owner && p.owner._id && p.owner._id.toString() !== userId.toString()) {
        teamMembersMap.set(p.owner._id.toString(), p.owner);
      }
      if (p.team && Array.isArray(p.team)) {
        p.team.forEach(m => {
          if (m && m._id && m._id.toString() !== userId.toString()) {
            teamMembersMap.set(m._id.toString(), m);
          }
        });
      }
    });
    const teamMembers = Array.from(teamMembersMap.values()).map(u => ({
      name: u.name || u.email,
      email: u.email,
      role: u.role || "Member",
      avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email || "User")}`
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
      recentProjects: recentProjectsWithProgress,
      recentTasks,
      upcomingDeadlines,
      teamMembers,
      timeTracking
    };
  }
}

module.exports = new ProjectService();
