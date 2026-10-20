const Project = require("../models/projectSchema");
const Task = require("../models/taskSchema");
const ProjectGroup = require("../models/projectGroupSchema");
const User = require("../models/userSchema");
const Department = require("../models/department");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../utils/ExpressError");
const { createNotification } = require('../utils/notificationService');

class ProjectService {
  async validateCompanyReferences(companyId, { owner, team, department, projectGroup } = {}) {
    const userIds = [owner, ...(team || [])].filter(Boolean);
    if (userIds.length) {
      const count = await User.countDocuments({ _id: { $in: userIds }, company: companyId });
      if (count !== new Set(userIds.map(String)).size) {
        throw new BadRequestError("Owner and team members must belong to the project company");
      }
    }
    if (
      department &&
      !(await Department.exists({
        _id: department,
        $or: [{ company: companyId }, { company: null }, { company: { $exists: false } }],
      }))
    ) {
      throw new BadRequestError("Department must belong to the project company");
    }
    if (projectGroup) {
      const groupExists = await ProjectGroup.exists({ _id: projectGroup, company: companyId });
      if (!groupExists) {
        throw new BadRequestError("Project group must belong to the project company");
      }
    }
  }

  async withProgress(project, companyId) {
    const progressMap = await this.getProjectProgressMap([project._id], companyId);
    const result = project.toObject ? project.toObject() : { ...project };
    const progress = progressMap.get(project._id.toString());
    if (progress !== undefined) result.progress = progress;
    result.health = await this.getProjectHealth(result, companyId);
    return result;
  }

  async getProjectHealth(project, companyId) {
    const tasks = await Task.find({ company: companyId, project: project._id })
      .select("status dueDate completionPercent");
    const activeTasks = tasks.filter((task) => task.status !== "Done");
    const overdueTasks = activeTasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date());
    const blockedTasks = tasks.filter((task) => task.status === "Blocked");
    const overdueMilestones = (project.milestones || []).filter((milestone) =>
      milestone.status !== "Completed" && milestone.dueDate && new Date(milestone.dueDate) < new Date()
    );
    const progress = typeof project.progress === "number" ? project.progress : 0;
    const dueDate = project.dueDate ? new Date(project.dueDate) : null;
    const daysRemaining = dueDate ? Math.ceil((dueDate - new Date()) / 86400000) : null;
    const reasons = [];

    if (blockedTasks.length) reasons.push(`${blockedTasks.length} blocked task${blockedTasks.length === 1 ? "" : "s"}`);
    if (overdueTasks.length) reasons.push(`${overdueTasks.length} overdue task${overdueTasks.length === 1 ? "" : "s"}`);
    if (overdueMilestones.length) reasons.push(`${overdueMilestones.length} overdue milestone${overdueMilestones.length === 1 ? "" : "s"}`);
    if (daysRemaining !== null && daysRemaining < 0 && project.status !== "Completed") reasons.push("Project deadline passed");
    if (!reasons.length && daysRemaining !== null && daysRemaining <= 7 && project.status !== "Completed") {
      reasons.push("Deadline is within 7 days");
    }

    let status = "On Track";
    let score = 100;
    if (blockedTasks.length || overdueTasks.length || (daysRemaining !== null && daysRemaining < 0)) {
      status = "At Risk";
      score = 55;
    } else if (daysRemaining !== null && daysRemaining <= 7 && progress < 75) {
      status = "Watch";
      score = 75;
    }
    if (project.status === "Completed") {
      status = "On Track";
      score = 100;
    }

    return { status, score, reasons, activeTasks: activeTasks.length };
  }

  mapAttachments(files) {
    return (files || []).map((file) => ({
      public_id: file.blobName || file.filename,
      url: file.url || file.path,
      originalname: file.originalname,
      format: file.mimetype,
      size: file.size
    }));
  }

  async createProject(user, companyId, data, files) {
    const { title, description, team, strict, isPublic, startDate, dueDate, owner: dataOwner, department, status, projectGroup, milestones } = data;
    const owner = dataOwner || user.id || user._id;
    await this.validateCompanyReferences(companyId, { owner, team, department, projectGroup });

    const project = new Project({
      title,
      description,
      team,
      owner,
      department,
      projectGroup: projectGroup || null,
      status,
      strict,
      isPublic,
      startDate,
      dueDate,
      milestones,
      attachments: this.mapAttachments(files),
      company: companyId,
    });

    const savedProject = await project.save();

    if (savedProject.projectGroup) {
      await ProjectGroup.findByIdAndUpdate(savedProject.projectGroup, {
        $addToSet: { projects: savedProject._id }
      });
    }

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

    require("./activityLogService").recordActivity({
      actorId: owner,
      action: `created project "${savedProject.title}"`,
      entityType: "project",
      entityId: savedProject._id,
      companyId,
      level: "success",
    });

    return this.withProgress(savedProject, companyId);
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
    const { page = 1, limit = 20, search = '', status, myProjects, projectGroup } = query;
    const skip = (page - 1) * limit;

    const userId = user.id || user._id;

    const filter = {
      company: companyId,
      ...(status && { status }),
      ...(projectGroup && { projectGroup }),
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
        .populate("projectGroup", "name")
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
      .populate("owner", "name email avatar")
      .populate("projectGroup", "name description");

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

    return this.withProgress(project, companyId);
  }

  async updateProject(user, companyId, projectId, data, files) {
    const { title, description, team, status, strict, isPublic, startDate, dueDate, owner, department, projectGroup, milestones } = data;

    const project = await Project.findOne({ _id: projectId, company: companyId });
    if (!project) throw new NotFoundError("Project");
    await this.validateCompanyReferences(companyId, {
      ...(owner !== undefined && { owner }),
      ...(team !== undefined && { team }),
      ...(department !== undefined && { department }),
      ...(projectGroup ? { projectGroup } : {})
    });

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
    project.team = team !== undefined ? team : project.team;
    project.status = status || project.status;
    project.strict = strict !== undefined ? strict : project.strict;
    project.isPublic = isPublic !== undefined ? isPublic : project.isPublic;
    project.startDate = startDate !== undefined ? startDate : project.startDate;
    project.dueDate = dueDate !== undefined ? dueDate : project.dueDate;
    project.owner = owner !== undefined ? owner : project.owner;
    project.department = department !== undefined ? department : project.department;
    project.milestones = milestones !== undefined ? milestones : project.milestones;

    if (projectGroup !== undefined) {
      const oldGroupId = project.projectGroup ? project.projectGroup.toString() : null;
      const newGroupId = projectGroup ? projectGroup.toString() : null;
      if (oldGroupId !== newGroupId) {
        if (oldGroupId) {
          await ProjectGroup.findByIdAndUpdate(oldGroupId, { $pull: { projects: project._id } });
        }
        if (newGroupId) {
          await ProjectGroup.findByIdAndUpdate(newGroupId, { $addToSet: { projects: project._id } });
        }
        project.projectGroup = newGroupId || null;
      }
    }

    if (files?.length) {
      project.attachments = [...(project.attachments || []), ...this.mapAttachments(files)];
    }

    const updatedProject = await project.save();
    await updatedProject.populate("projectGroup", "name description");

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

    require("./activityLogService").recordActivity({
      actorId: user.id || user._id,
      action: `updated project "${updatedProject.title}"`,
      entityType: "project",
      entityId: updatedProject._id,
      companyId,
      level: "info",
    });

    return this.withProgress(updatedProject, companyId);
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

    if (project.projectGroup) {
      await ProjectGroup.findByIdAndUpdate(project.projectGroup, { $pull: { projects: project._id } });
    }
    await ProjectGroup.updateMany({ projects: project._id, company: companyId }, { $pull: { projects: project._id } });

    await project.deleteOne();
  }

  async getUserProjects(user, companyId) {
    const userId = user.id || user._id;

    const projects = await Project.find({
      company: companyId,
      $or: [{ owner: userId }, { team: userId }],
    })
      .populate("team", "name email avatar")
      .populate("owner", "name email avatar");
    const progressMap = await this.getProjectProgressMap(projects.map(p => p._id), companyId);
    return projects.map(p => {
      const result = p.toObject();
      const progress = progressMap.get(p._id.toString());
      if (progress !== undefined) result.progress = progress;
      return result;
    });
  }

  async getProjectDashboard(user, companyId) {
    const userId = user.id || user._id;

    const userRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = userRole === 'admin';
    const isManagerTech = userRole === 'manager' && user.isTechnician;
    const isPrivileged = isSuperAdmin || isAdmin || isManagerTech;

    const projectScope = isPrivileged
      ? { company: companyId }
      : { company: companyId, $or: [{ owner: userId }, { team: userId }] };

    const activeStatusQuery = { $in: ["Active", "Planning", "In Progress", "Open"] };

    const activeProjects = await Project.countDocuments({
      ...projectScope,
      status: activeStatusQuery,
    });

    const completedProjects = await Project.countDocuments({
      ...projectScope,
      status: "Completed",
    });

    const taskFilter = {
      company: companyId,
      status: { $ne: "Done" },
      ...(isPrivileged ? {} : { team: userId }),
    };

    const [openTasks, highTasks, mediumTasks, lowTasks, overdueTasks] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, priority: "High" }),
      Task.countDocuments({ ...taskFilter, priority: "Medium" }),
      Task.countDocuments({ ...taskFilter, priority: { $in: ["Low", null, undefined] } }),
      Task.countDocuments({ ...taskFilter, dueDate: { $lt: new Date() } }),
    ]);

    const taskPriorities = {
      high: highTasks,
      medium: mediumTasks,
      low: lowTasks,
      overdue: overdueTasks,
      total: openTasks,
    };

    // "Project Groups" must count ProjectGroup documents (was: count of projects)
    const projectGroups = await ProjectGroup.countDocuments({ company: companyId });

    // Fetch lists for dynamic dashboard mapping
    const recentProjects = await Project.find({
      ...projectScope,
      status: activeStatusQuery,
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
      ...(isPrivileged ? {} : { team: userId }),
    }).sort({ dueDate: 1 }).limit(5).populate('project', 'title');

    // Fetch upcoming deadlines (tasks and projects)
    const upcomingDeadlines = [];
    const upcomingTasks = await Task.find({
      company: companyId,
      status: { $ne: "Done" },
      ...(isPrivileged ? {} : { team: userId }),
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
      ...projectScope,
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
      timeTracking,
      taskPriorities
    };
  }
}

module.exports = new ProjectService();
