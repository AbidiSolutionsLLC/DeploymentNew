const Project = require("../models/projectSchema");
const Task = require("../models/taskSchema");
const ProjectGroup = require("../models/projectGroupSchema");
const User = require("../models/userSchema");
const Department = require("../models/department");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../utils/ExpressError");
const { getEffectiveProjectRole, hasProjectPortalAccess } = require("../utils/projectRbac");
const { createNotification } = require('../utils/notificationService');

const PROJECT_DASHBOARD_CARD_TYPES = [
  "activeProjects",
  "taskPriorities",
  "openTasks",
  "upcomingDeadlines",
  "teamMembers",
];
const LEGACY_PROJECT_DASHBOARD_CARD_TYPES = ["tasksDeadlines"];
const DEFAULT_PROJECT_DASHBOARD_CARD_TYPES = [
  "activeProjects",
  "taskPriorities",
  "openTasks",
  "upcomingDeadlines",
  "teamMembers",
];
const DASHBOARD_CARD_ORDER = [
  "activeProjects",
  "taskPriorities",
  "openTasks",
  "upcomingDeadlines",
  "teamMembers",
];
const DEFAULT_PROJECT_DASHBOARD_CARDS = DEFAULT_PROJECT_DASHBOARD_CARD_TYPES.map((type) => ({
  type,
  id: type,
}));

const normalizeProjectDashboardCards = (cards) => {
  if (!Array.isArray(cards)) return cards;

  const hasLegacy = cards.some((card) => LEGACY_PROJECT_DASHBOARD_CARD_TYPES.includes(card.type));
  if (!hasLegacy) return cards;

  const normalized = [];

  cards.forEach((card) => {
    if (LEGACY_PROJECT_DASHBOARD_CARD_TYPES.includes(card.type)) {
      if (!normalized.some((item) => item.type === "openTasks")) {
        normalized.push({ type: "openTasks", id: "openTasks" });
      }
      if (!normalized.some((item) => item.type === "upcomingDeadlines")) {
        normalized.push({ type: "upcomingDeadlines", id: "upcomingDeadlines" });
      }
      return;
    }
    if (!normalized.some((item) => item.type === card.type)) {
      normalized.push(card);
    }
  });

  return normalized.sort((a, b) => {
    const aIndex = DASHBOARD_CARD_ORDER.indexOf(a.type);
    const bIndex = DASHBOARD_CARD_ORDER.indexOf(b.type);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });
};

class ProjectService {
  ensureProjectPortalAccess(user) {
    if (!hasProjectPortalAccess(user)) {
      throw new ForbiddenError("You do not have access to the Project Portal.");
    }
  }

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
    this.ensureProjectPortalAccess(user);
    const userRole = getEffectiveProjectRole(user);
    if (userRole !== 'project_administrator') {
      throw new ForbiddenError("Only Project Administrators can create new projects.");
    }
    const { title, description, team, strict, isPublic, startDate, dueDate, owner: dataOwner, department, status, projectGroup, milestones, customStatuses, statusOrder } = data;
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
      statusOrder: statusOrder || [],
      customStatuses: customStatuses || [],
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

    const assignedUserIds = [savedProject.owner, ...(savedProject.team || [])]
      .filter(Boolean)
      .map(id => (typeof id === 'object' ? id._id || id.id : id).toString());

    if (assignedUserIds.length > 0) {
      await User.updateMany(
        { _id: { $in: assignedUserIds }, company: companyId, hasProjectPortalAccess: { $ne: true } },
        { $set: { hasProjectPortalAccess: true } }
      );

      const { sseClients } = require('../utils/sseManager');
      assignedUserIds.forEach(uid => {
        const clients = sseClients.get(uid);
        if (clients) {
          clients.forEach(client => {
            try {
              client.write("data: " + JSON.stringify({ type: "PROJECT_ACCESS_UPDATED" }) + "\n\n");
            } catch (e) {
              console.error("Failed to push PROJECT_ACCESS_UPDATED event", e);
            }
          });
        }
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

  // Progress rule:
  // - Completed project = 100%
  // - Average task progress across tasks (Done tasks count as 100%, otherwise completionPercent)
  // - Projects without tasks = 0%
  async getProjectProgressMap(projectIds, companyId) {
    const map = new Map();
    if (!projectIds || projectIds.length === 0) return map;

    const [tasks, projects] = await Promise.all([
      Task.find({ company: companyId, project: { $in: projectIds } })
        .select("project completionPercent status"),
      Project.find({ _id: { $in: projectIds }, company: companyId })
        .select("_id status")
    ]);

    const projectStatusMap = new Map();
    projects.forEach((p) => projectStatusMap.set(p._id.toString(), p.status));

    const sums = new Map();
    const counts = new Map();

    tasks.forEach((t) => {
      if (!t.project) return;
      const key = t.project.toString();
      const taskPct = t.status === "Done" ? 100 : (typeof t.completionPercent === "number" ? t.completionPercent : 0);
      sums.set(key, (sums.get(key) || 0) + taskPct);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    projectIds.forEach((pid) => {
      const key = pid.toString();
      const pStatus = projectStatusMap.get(key);
      if (pStatus === "Completed") {
        map.set(key, 100);
      } else if (counts.has(key) && counts.get(key) > 0) {
        map.set(key, Math.round(sums.get(key) / counts.get(key)));
      } else {
        map.set(key, 0);
      }
    });

    return map;
  }

  async getAllProjects(user, companyId, query = {}) {
    this.ensureProjectPortalAccess(user);
    const { page = 1, limit = 20, search = '', status, myProjects, projectGroup } = query;
    const skip = (page - 1) * limit;
    const userId = user.id || user._id;
    const userRole = getEffectiveProjectRole(user);
    const isProjectAdmin = userRole === 'project_administrator';
    const isAdmin = userRole === 'admin';
    const isGlobalReader = userRole === 'globalreader';
    const isProjectManager = userRole === 'project_manager';

    let roleFilter = {};
    if (isProjectAdmin) {
      if (myProjects === 'true') {
        roleFilter = { $or: [{ owner: userId }, { team: userId }] };
      }
    } else if (isProjectManager) {
      roleFilter = { $or: [{ owner: userId }, { team: userId }] };
    } else {
      roleFilter = { team: userId };
    }

    const filter = {
      company: companyId,
      ...roleFilter,
      ...(status && { status }),
      ...(projectGroup && { projectGroup }),
      ...(search && {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
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
    this.ensureProjectPortalAccess(user);
    const project = await Project.findOne({ _id: projectId, company: companyId })
      .populate("team", "name email avatar")
      .populate("owner", "name email avatar")
      .populate("projectGroup", "name description");

    if (!project) throw new NotFoundError("Project");

    const userRole = getEffectiveProjectRole(user);
    const isProjectAdmin = userRole === 'project_administrator';
    const isAdmin = userRole === 'admin';
    const isGlobalReader = (user.role || '').replace(/\s+/g, '').toLowerCase() === 'globalreader';
    const isOwner = project.owner && project.owner._id ? project.owner._id.toString() === (user.id || user._id).toString() : project.owner?.toString() === (user.id || user._id).toString();
    const isTeamMember = project.team.some(member => {
        return member && member._id ? member._id.toString() === (user.id || user._id).toString() : member.toString() === (user.id || user._id).toString();
    });
    
    if (!isProjectAdmin && !isOwner && !isTeamMember) {
      throw new ForbiddenError("You do not have permission to access this project.");
    }

    return this.withProgress(project, companyId);
  }

  async updateProject(user, companyId, projectId, data, files) {
    this.ensureProjectPortalAccess(user);
    const { title, description, team, status, strict, isPublic, startDate, dueDate, owner, department, projectGroup, milestones, customStatuses, statusOrder } = data;

    const project = await Project.findOne({ _id: projectId, company: companyId });
    if (!project) throw new NotFoundError("Project");
    await this.validateCompanyReferences(companyId, {
      ...(owner !== undefined && { owner }),
      ...(team !== undefined && { team }),
      ...(department !== undefined && { department }),
      ...(projectGroup ? { projectGroup } : {})
    });

    const userRole = getEffectiveProjectRole(user);
    const isProjectAdmin = userRole === 'project_administrator';
    const isAdmin = userRole === 'admin';
    const isOwner = project.owner && project.owner._id ? project.owner._id.toString() === (user.id || user._id).toString() : project.owner?.toString() === (user.id || user._id).toString();
    const isTeamMember = Array.isArray(project.team) && project.team.some(member => {
      const mid = member && member._id ? member._id.toString() : member ? member.toString() : '';
      return mid === (user.id || user._id).toString();
    });
    const isAssignedManager = userRole === 'project_manager' && (isOwner || isTeamMember);

    if (!isProjectAdmin && !isOwner && !isAssignedManager) {
      throw new ForbiddenError("Only project managers or administrators can modify project settings.");
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
    project.statusOrder = statusOrder !== undefined ? statusOrder : project.statusOrder;
    project.customStatuses = customStatuses !== undefined ? customStatuses : project.customStatuses;

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
    await updatedProject.populate("team", "name email avatar");
    await updatedProject.populate("owner", "name email avatar");
    await updatedProject.populate("department", "name");

    const assignedUserIds = [updatedProject.owner, ...(updatedProject.team || [])]
      .filter(Boolean)
      .map(id => (typeof id === 'object' ? id._id || id.id : id).toString());

    if (assignedUserIds.length > 0) {
      await User.updateMany(
        { _id: { $in: assignedUserIds }, company: companyId, hasProjectPortalAccess: { $ne: true } },
        { $set: { hasProjectPortalAccess: true } }
      );

      const { sseClients } = require('../utils/sseManager');
      assignedUserIds.forEach(uid => {
        const clients = sseClients.get(uid);
        if (clients) {
          clients.forEach(client => {
            try {
              client.write("data: " + JSON.stringify({ type: "PROJECT_ACCESS_UPDATED" }) + "\n\n");
            } catch (e) {
              console.error("Failed to push PROJECT_ACCESS_UPDATED event", e);
            }
          });
        }
      });
    }

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
    this.ensureProjectPortalAccess(user);
    const project = await Project.findOne({ _id: projectId, company: companyId });
    if (!project) throw new NotFoundError("Project");
    const userRole = getEffectiveProjectRole(user);
    const isProjectAdmin = userRole === 'project_administrator';
    const isAdmin = userRole === 'admin';
    
    if (!isProjectAdmin) {
      throw new ForbiddenError("Only Project Administrators can delete projects.");
    }

    // A project can only be deleted if its status is Completed and all its tasks are in Done status
    if (project.status !== "Completed") {
      throw new BadRequestError(`Cannot delete project: Project status is "${project.status}". It must be marked as "Completed" before deletion.`);
    }

    const tasks = await Task.find({ project: project._id, company: companyId }).select("title status");
    const incompleteTasks = tasks.filter((t) => t.status !== "Done");

    if (incompleteTasks.length > 0) {
      const statusCounts = {};
      incompleteTasks.forEach((t) => {
        const s = t.status || "Unknown";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const breakdown = Object.entries(statusCounts)
        .map(([st, cnt]) => `${cnt} in ${st}`)
        .join(", ");
      throw new BadRequestError(
        `Cannot delete project: ${incompleteTasks.length} task(s) are not completed (${breakdown}). All tasks must be in "Done" status before deleting the project.`
      );
    }

    // Clean up associated Done tasks
    if (tasks.length > 0) {
      await Task.deleteMany({ project: project._id, company: companyId });
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

  async getProjectDashboardCards(userId) {
    const user = await User.findById(userId).select("projectDashboardCards");
    if (!user) throw new NotFoundError("User not found");

    if (user.projectDashboardCards === undefined) {
      return DEFAULT_PROJECT_DASHBOARD_CARDS;
    }

    const normalized = normalizeProjectDashboardCards(user.projectDashboardCards);
    if (normalized !== user.projectDashboardCards) {
      user.projectDashboardCards = normalized;
      await user.save();
    }
    return normalized;
  }

  async addProjectDashboardCard(userId, type) {
    if (!PROJECT_DASHBOARD_CARD_TYPES.includes(type)) {
      throw new BadRequestError("Invalid dashboard card type");
    }

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const existing = user.projectDashboardCards === undefined
      ? [...DEFAULT_PROJECT_DASHBOARD_CARDS]
      : normalizeProjectDashboardCards(user.projectDashboardCards);

    if (existing.some((card) => card.type === type)) {
      throw new BadRequestError("Card already exists");
    }

    user.projectDashboardCards = [
      ...existing,
      { type, id: `${type}-${Date.now()}` },
    ];
    await user.save();
    return user.projectDashboardCards;
  }

  async removeProjectDashboardCard(userId, cardId) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const existing = user.projectDashboardCards === undefined
      ? [...DEFAULT_PROJECT_DASHBOARD_CARDS]
      : [...normalizeProjectDashboardCards(user.projectDashboardCards)];

    const remaining = existing.filter((card) => card.id !== cardId);
    if (remaining.length === existing.length) {
      throw new NotFoundError("Card not found");
    }

    user.projectDashboardCards = remaining;
    await user.save();
    return user.projectDashboardCards;
  }

  async getProjectDashboard(user, companyId) {
    this.ensureProjectPortalAccess(user);
    const userId = user.id || user._id;
    const userRole = getEffectiveProjectRole(user);
    const isProjectAdmin = userRole === 'project_administrator';
    const isAdmin = userRole === 'admin';
    const isProjectManager = userRole === 'project_manager';

    let projectScope;
    if (isProjectAdmin) {
      projectScope = { company: companyId };
    } else if (isProjectManager) {
      projectScope = { company: companyId, $or: [{ owner: userId }, { team: userId }] };
    } else {
      projectScope = { company: companyId, team: userId };
    }

    const activeStatusQuery = { $in: ["Active", "Planning", "In Progress", "Open"] };

    const [totalProjects, activeProjects, completedProjects, delayedProjects] = await Promise.all([
      Project.countDocuments(projectScope),
      Project.countDocuments({
        ...projectScope,
        status: activeStatusQuery,
      }),
      Project.countDocuments({
        ...projectScope,
        status: "Completed",
      }),
      Project.countDocuments({
        ...projectScope,
        status: { $nin: ["Completed", "Cancelled"] },
        dueDate: { $lt: new Date() },
      }),
    ]);

    let taskFilter;
    if (isProjectAdmin) {
      taskFilter = { company: companyId, status: { $ne: "Done" } };
    } else if (isProjectManager) {
      const managerProjects = await Project.find({ company: companyId, $or: [{ owner: userId }, { team: userId }] }).select('_id');
      const managerProjectIds = managerProjects.map(p => p._id);
      taskFilter = {
        company: companyId,
        status: { $ne: "Done" },
        $or: [{ project: { $in: managerProjectIds } }, { team: userId }]
      };
    } else {
      taskFilter = { company: companyId, team: userId, status: { $ne: "Done" } };
    }

    const [openTasks, highTasks, mediumTasks, lowTasks, overdueTasks, myTasksCount] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, priority: "High" }),
      Task.countDocuments({ ...taskFilter, priority: "Medium" }),
      Task.countDocuments({ ...taskFilter, priority: { $in: ["Low", null, undefined] } }),
      Task.countDocuments({ ...taskFilter, dueDate: { $lt: new Date() } }),
      Task.countDocuments({ company: companyId, team: userId, status: { $ne: "Done" } }),
    ]);

    const taskPriorities = {
      high: highTasks,
      medium: mediumTasks,
      low: lowTasks,
      overdue: overdueTasks,
      total: openTasks,
    };

    let projectGroups = 0;
    if (isProjectAdmin) {
      projectGroups = await ProjectGroup.countDocuments({ company: companyId });
    } else {
      const scopedProjects = await Project.find(projectScope).select('projectGroup');
      const groupIds = [...new Set(scopedProjects.map(p => p.projectGroup).filter(Boolean).map(String))];
      projectGroups = groupIds.length;
    }

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

    const recentTasks = await Task.find(taskFilter)
      .sort({ dueDate: 1 })
      .limit(5)
      .populate('project', 'title');

    // Fetch upcoming deadlines (tasks and projects)
    const upcomingDeadlines = [];
    const upcomingTasks = await Task.find({
      ...taskFilter,
      dueDate: { $gte: new Date() }
    }).sort({ dueDate: 1 }).limit(3).populate('project', 'title');
    
    upcomingTasks.forEach(t => {
      upcomingDeadlines.push({
        task: t.title,
        project: t.project?.title || "N/A",
        projectId: t.project?._id || t.project,
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
      totalProjects,
      activeProjects,
      completedProjects,
      delayedProjects,
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
