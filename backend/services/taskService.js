const Task = require("../models/taskSchema");
const Project = require("../models/projectSchema");
const User = require("../models/userSchema");
const { NotFoundError, BadRequestError, ForbiddenError, UnauthorizedError } = require("../utils/ExpressError");
const { getEffectiveProjectRole, hasProjectPortalAccess } = require("../utils/projectRbac");
const notificationService = require('../utils/notificationService');

class TaskService {
  async validateTaskStatus(companyId, projectId, status) {
    if (!status) return;
    const ProjectModel = require("../models/projectSchema");
    const query = ProjectModel.findOne({ _id: projectId, company: companyId });
    const proj = typeof query?.select === "function"
      ? await query.select("statuses customStatuses").lean()
      : typeof query?.lean === "function"
      ? await query.lean()
      : await query;
    if (!proj) return;

    if (Array.isArray(proj.statuses) && proj.statuses.length > 0) {
      const allowedLabels = proj.statuses.map((s) => (s.label || "").toLowerCase());
      if (!allowedLabels.includes(String(status).toLowerCase())) {
        throw new BadRequestError(`Invalid task status: "${status}"`);
      }
      return;
    }

    const BUILTIN_STATUSES = ["Backlog", "Todo", "In Progress", "In Review", "Done"];
    if (BUILTIN_STATUSES.map((b) => b.toLowerCase()).includes(String(status).toLowerCase())) return;
    const customLabels = (proj?.customStatuses || []).map((cs) => (cs.label || "").toLowerCase());
    if (!customLabels.includes(String(status).toLowerCase())) {
      throw new BadRequestError(`Invalid task status: "${status}"`);
    }
  }

  ensureProjectPortalAccess(user) {
    if (!hasProjectPortalAccess(user)) {
      throw new ForbiddenError("You do not have access to the Project Portal.");
    }
  }

  async validateCompanyTeam(companyId, team) {
    if (!team || !team.length) return;
    const cleanTeam = [...new Set(team.filter(Boolean).map(String))];
    if (!cleanTeam.length) return;
    const count = await User.countDocuments({ _id: { $in: cleanTeam }, company: companyId });
    if (count !== cleanTeam.length) {
      throw new BadRequestError("All task team members must belong to the task company");
    }
  }

  async validateDependencies(companyId, projectId, taskId, dependencies = []) {
    const uniqueDependencies = [...new Set((dependencies || []).map(String))];
    if (taskId && uniqueDependencies.includes(String(taskId))) {
      throw new BadRequestError("A task cannot depend on itself");
    }
    if (!uniqueDependencies.length) return uniqueDependencies;
    const count = await Task.countDocuments({
      _id: { $in: uniqueDependencies },
      project: projectId,
      company: companyId,
    });
    if (count !== uniqueDependencies.length) {
      throw new BadRequestError("Dependencies must be tasks in the same project");
    }
    if (taskId) {
      const visited = new Set();
      const queue = [...uniqueDependencies];
      while (queue.length) {
      const dependencyId = queue.shift();
      if (visited.has(dependencyId)) continue;
      visited.add(dependencyId);
      if (dependencyId === String(taskId)) {
        throw new BadRequestError("Task dependencies cannot contain a cycle");
      }
      const dependency = await Task.findOne({
        _id: dependencyId,
        project: projectId,
        company: companyId,
      }).select("dependencies").lean();
      (dependency?.dependencies || []).forEach((nextId) => queue.push(String(nextId)));
      }
    }
    return uniqueDependencies;
  }

  mapAttachments(files) {
    return (files || []).map((file) => ({
      name: file.originalname || file.name,
      originalname: file.originalname || file.name,
      url: file.url || file.path,
      blobName: file.blobName || file.filename,
      public_id: file.blobName || file.filename || file.public_id,
      size: file.size,
      format: file.mimetype || file.format,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    }));
  }

  assertCanModifyTask(user, companyId, task, projectDoc) {
    this.ensureProjectPortalAccess(user);
    const userId = user.id || user._id;
    const userRole = getEffectiveProjectRole(user);
    const isProjectAdmin = userRole === 'project_administrator';
    const isProjectManager = userRole === 'project_manager';
    const isAssignee = task.team && task.team.some(member => {
      const memberId = (member?._id || member || '').toString();
      return (user._id && memberId === user._id.toString()) || (user.id && memberId === user.id.toString());
    });

    if (isProjectAdmin) return { isProjectAdmin, isProjectManager, isAssignee };

    const isProjectOwner = projectDoc && projectDoc.owner && (
      (user._id && projectDoc.owner.toString() === user._id.toString()) ||
      (user.id && projectDoc.owner.toString() === user.id.toString())
    );

    if (isProjectManager) {
      if (!isProjectOwner && !isAssignee) {
        throw new ForbiddenError("You do not have permission to modify this task.");
      }
    } else {
      if (!isAssignee) {
        throw new ForbiddenError("You can only modify tasks assigned to you.");
      }
    }

    return { isProjectAdmin, isProjectManager, isAssignee, isProjectOwner };
  }

  async createTask(user, companyId, data, files) {
    this.ensureProjectPortalAccess(user);
    const userId = user?.id || user?._id;
    const userRole = getEffectiveProjectRole(user);

    if (userRole !== 'project_administrator' && userRole !== 'project_manager') {
      throw new ForbiddenError("Team members cannot create new tasks.");
    }

    const { title, description, project, priority, status, dueDate, duration, completionPercent, workedHours, dependencies } = data;
    const rawTeam = data.team !== undefined ? data.team : (data.assignees !== undefined ? data.assignees : data.assignee);
    let team = [];
    if (Array.isArray(rawTeam)) {
      team = [...new Set(rawTeam.filter(Boolean).map(String))];
    } else if (typeof rawTeam === 'string') {
      try {
        const parsed = JSON.parse(rawTeam);
        if (Array.isArray(parsed)) {
          team = [...new Set(parsed.filter(Boolean).map(String))];
        } else if (parsed) {
          team = [String(parsed)];
        }
      } catch (e) {
        if (rawTeam.trim()) team = [String(rawTeam.trim())];
      }
    } else if (rawTeam) {
      team = [String(rawTeam)];
    }

    let parsedDeps = dependencies;
    if (typeof dependencies === 'string') {
      try {
        const parsed = JSON.parse(dependencies);
        if (Array.isArray(parsed)) parsedDeps = parsed;
        else if (parsed) parsedDeps = [String(parsed)];
      } catch (e) {
        if (dependencies.trim()) parsedDeps = [dependencies.trim()];
      }
    }

    const projectExists = await Project.findOne({ _id: project, company: companyId });
    if (!projectExists) throw new NotFoundError("Project");

    if (dueDate && projectExists.dueDate) {
      const taskDue = new Date(dueDate);
      const projectDue = new Date(projectExists.dueDate);
      if (taskDue.getTime() > projectDue.getTime()) {
        const formattedProjDue = projectDue.toISOString().split("T")[0];
        throw new BadRequestError(`Task due date cannot be after the project end date (${formattedProjDue}).`);
      }
    }

    if (userRole === 'project_manager') {
      const isOwner = projectExists.owner && projectExists.owner.toString() === userId.toString();
      const isTeam = projectExists.team && projectExists.team.some(m => m.toString() === userId.toString());
      if (!isOwner && !isTeam) {
        throw new ForbiddenError("Project managers can only create tasks in projects they manage or belong to.");
      }
    }
    await this.validateCompanyTeam(companyId, team);
    await this.validateTaskStatus(companyId, project, status);
    const validDependencies = await this.validateDependencies(companyId, project, null, parsedDeps);

    const task = new Task({
      title,
      description,
      project,
      createdBy: userId,
      team,
      priority,
      status,
      dueDate,
      duration,
      completionPercent,
      workedHours,
      attachments: this.mapAttachments(files),
      company: companyId,
      dependencies: validDependencies,
    });

    let savedTask;
    let attempts = 0;
    while (!savedTask && attempts < 3) {
      try {
        savedTask = await task.save();
      } catch (err) {
        if (err.code === 11000 && (err.keyPattern?.taskID || err.message?.includes("taskID"))) {
          attempts++;
          task.taskID = undefined;
          if (attempts >= 3) throw err;
        } else {
          throw err;
        }
      }
    }

    require("./activityLogService").recordActivity({
      actorId: user?.id || user?._id,
      action: `created task "${savedTask.title}"`,
      entityType: "task",
      entityId: savedTask._id,
      companyId,
      level: "success",
    });

    if (savedTask.team && savedTask.team.length > 0) {
      try {
        const notifPromises = savedTask.team.map(memberId =>
          notificationService.createNotification({
            recipient: memberId,
            type: 'TASK_ASSIGNED',
            title: 'New Task Assigned',
            message: `You have been assigned the task "${savedTask.title}" in project "${projectExists.title}".`,
            relatedEntity: { entityType: 'task', entityId: savedTask._id },
          })
        );
        await Promise.all(notifPromises);
      } catch (notifErr) {
        console.error('[Notification] Task created:', notifErr.message);
      }
    }

    return savedTask;
  }

  async getAllTasks(user, companyId, query = {}) {
    this.ensureProjectPortalAccess(user);
    const { page = 1, limit = 20, search = '', project, status, priority, assignee } = query;
    const skip = (page - 1) * limit;
    const userId = user.id || user._id;
    const userRole = getEffectiveProjectRole(user);
    const isProjectAdmin = userRole === 'project_administrator';
    const isProjectManager = userRole === 'project_manager';

    let roleFilter = {};
    if (isProjectAdmin) {
      if (assignee) roleFilter = { team: assignee };
    } else if (isProjectManager) {
      const managerProjects = await Project.find({ company: companyId, $or: [{ owner: userId }, { team: userId }] }).select('_id');
      const managerProjectIds = managerProjects.map(p => p._id);
      roleFilter = {
        $or: [
          { project: { $in: managerProjectIds } },
          { team: userId },
          { createdBy: userId }
        ]
      };
      if (assignee) roleFilter = { ...roleFilter, team: assignee };
    } else {
      roleFilter = { team: userId };
    }

    const filter = {
      company: companyId,
      ...roleFilter,
      ...(project && { project }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      })
    };

    const [data, total] = await Promise.all([
      Task.find(filter)
        .populate("team", "name email avatar")
        .populate("project", "title")
        .populate("dependencies", "title status")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Task.countDocuments(filter)
    ]);

    return {
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getTaskById(companyId, taskId) {
    const task = await Task.findOne({ _id: taskId, company: companyId })
      .populate("team", "name email avatar")
      .populate("project", "title")
      .populate("dependencies", "title status")
      .populate("comments.user", "name email avatar")
      .populate("comments.replyTo.user", "name email avatar");

    if (!task) throw new NotFoundError("Task");
    return task;
  }

  async updateTask(user, companyId, taskId, data, files) {
    const {
      title, description, priority, dueDate, duration,
      completionPercent,       workedHours, status, dependencies
    } = data;
    const rawTeam = data.team !== undefined ? data.team : (data.assignees !== undefined ? data.assignees : data.assignee);
    let team = undefined;
    if (rawTeam !== undefined) {
      if (Array.isArray(rawTeam)) {
        team = [...new Set(rawTeam.filter(Boolean).map(String))];
      } else if (typeof rawTeam === 'string') {
        try {
          const parsed = JSON.parse(rawTeam);
          if (Array.isArray(parsed)) {
            team = [...new Set(parsed.filter(Boolean).map(String))];
          } else if (parsed) {
            team = [String(parsed)];
          } else {
            team = [];
          }
        } catch (e) {
          team = rawTeam.trim() ? [rawTeam.trim()] : [];
        }
      } else if (rawTeam) {
        team = [String(rawTeam)];
      } else {
        team = [];
      }
    }

    let parsedDeps = dependencies;
    if (typeof dependencies === 'string') {
      try {
        const parsed = JSON.parse(dependencies);
        if (Array.isArray(parsed)) parsedDeps = parsed;
        else if (parsed) parsedDeps = [String(parsed)];
      } catch (e) {
        parsedDeps = dependencies.trim() ? [dependencies.trim()] : [];
      }
    }

    this.ensureProjectPortalAccess(user);
    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");

    const userId = user.id || user._id;
    const userRole = getEffectiveProjectRole(user);
    const isProjectAdmin = userRole === 'project_administrator';
    const isProjectManager = userRole === 'project_manager';
    const isAssignee = task.team && task.team.some(member => {
        const memberId = (member?._id || member || '').toString();
        return (user._id && memberId === user._id.toString()) || (user.id && memberId === user.id.toString());
    });

    const Project = require('../models/projectSchema');
    const projectQuery = Project.findOne({ _id: task.project, company: companyId });
    const projectDoc = projectQuery && typeof projectQuery.lean === 'function' ? await projectQuery.lean() : await projectQuery;
    const isProjectOwner = projectDoc && projectDoc.owner && (
        (user._id && projectDoc.owner.toString() === user._id.toString()) ||
        (user.id && projectDoc.owner.toString() === user.id.toString())
    );

    if (!isProjectAdmin) {
      if (isProjectManager) {
        if (!isProjectOwner && !isAssignee) {
          throw new ForbiddenError("You do not have permission to modify this task.");
        }
      } else {
        // Employee or other role
        if (!isAssignee) {
          throw new ForbiddenError("You can only modify tasks assigned to you.");
        }
        // Critical fields check: Employee cannot alter team, priority, dueDate, duration, dependencies, project
        const currentTeamIds = (task.team || []).map(m => (m?._id || m || '').toString());
        const teamChanged = team !== undefined && (
          team.length !== currentTeamIds.length ||
          team.some(id => !currentTeamIds.includes(String(id)))
        );
        const priorityChanged = priority !== undefined && priority !== task.priority;
        const dueChanged = dueDate !== undefined && (new Date(dueDate).getTime() !== (task.dueDate ? new Date(task.dueDate).getTime() : null));
        const durationChanged = duration !== undefined && Number(duration) !== Number(task.duration);
        const depChanged = parsedDeps !== undefined && JSON.stringify((parsedDeps || []).map(String)) !== JSON.stringify((task.dependencies || []).map(String));

        if (teamChanged || priorityChanged || dueChanged || durationChanged || depChanged) {
          throw new ForbiddenError("Team members can only update task status, progress percentage, worked hours, description, and attachments.");
        }
      }
    }

    if (dueDate && projectDoc && projectDoc.dueDate) {
      const taskDue = new Date(dueDate);
      const projectDue = new Date(projectDoc.dueDate);
      if (taskDue.getTime() > projectDue.getTime()) {
        const formattedProjDue = projectDue.toISOString().split("T")[0];
        throw new BadRequestError(`Task due date cannot be after the project end date (${formattedProjDue}).`);
      }
    }

    if (status !== undefined) {
      await this.validateTaskStatus(companyId, task.project, status);
    }
    if (team !== undefined) {
      await this.validateCompanyTeam(companyId, team);
    }
    const validDependencies = parsedDeps !== undefined
      ? await this.validateDependencies(companyId, task.project, taskId, parsedDeps)
      : task.dependencies;

    const previousTeam = (task.team || []).map(id => (id?._id || id || '').toString());
    
    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    task.team = team !== undefined ? team : task.team;
    task.priority = priority !== undefined ? priority : task.priority;
    task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
    task.duration = duration !== undefined ? duration : task.duration;
    task.completionPercent = completionPercent !== undefined ? completionPercent : task.completionPercent;
    task.workedHours = workedHours !== undefined ? workedHours : task.workedHours;
    task.status = status !== undefined ? status : task.status;
    task.dependencies = validDependencies;

    // Handle deleted attachments if specified
    if (data.deletedAttachmentIds !== undefined) {
      let deletedIds = [];
      if (Array.isArray(data.deletedAttachmentIds)) {
        deletedIds = data.deletedAttachmentIds.map(String);
      } else if (typeof data.deletedAttachmentIds === 'string') {
        try {
          const parsed = JSON.parse(data.deletedAttachmentIds);
          if (Array.isArray(parsed)) deletedIds = parsed.map(String);
          else if (parsed) deletedIds = [String(parsed)];
        } catch (e) {
          if (data.deletedAttachmentIds.trim()) deletedIds = [data.deletedAttachmentIds.trim()];
        }
      }

      if (deletedIds.length > 0) {
        task.attachments = (task.attachments || []).filter(
          (att) => !deletedIds.includes((att._id || att.id || '').toString()) &&
                   !deletedIds.includes((att.public_id || att.blobName || '').toString())
        );
      }
    }

    // Handle renamed attachments if specified
    if (data.renamedAttachments !== undefined) {
      let renamedList = [];
      if (Array.isArray(data.renamedAttachments)) {
        renamedList = data.renamedAttachments;
      } else if (typeof data.renamedAttachments === 'string') {
        try {
          const parsed = JSON.parse(data.renamedAttachments);
          if (Array.isArray(parsed)) renamedList = parsed;
        } catch (e) {}
      }

      if (renamedList.length > 0) {
        renamedList.forEach(({ id, name }) => {
          if (!id || !name) return;
          const att = (task.attachments || []).find(
            (a) => (a._id || a.id || '').toString() === id.toString() ||
                   (a.public_id || a.blobName || '').toString() === id.toString() ||
                   (a.originalname || a.name || '').toString() === id.toString()
          );
          if (att) {
            att.name = name.trim();
            att.originalname = name.trim();
          }
        });
      }
    }

    // Handle newly uploaded files
    if (files?.length) {
      task.attachments = [...(task.attachments || []), ...this.mapAttachments(files)];
    }

    const updatedTask = await task.save();
    if (typeof updatedTask.populate === "function") {
      try {
        await updatedTask.populate("team", "name email avatar");
        await updatedTask.populate("project", "title");
        await updatedTask.populate("dependencies", "title status");
      } catch (e) {}
    }

    require("./activityLogService").recordActivity({
      actorId: user.id || user._id,
      action: `updated task "${updatedTask.title}"`,
      entityType: "task",
      entityId: updatedTask._id,
      companyId,
      level: "info",
    });

    if (team && team.length > 0) {
      const newMembers = team.filter(id => !previousTeam.includes(id.toString()));
      if (newMembers.length > 0) {
        const projectDoc = await Project.findOne({ _id: updatedTask.project, company: companyId }).select('title').lean();
        try {
          const notifPromises = newMembers.map(memberId =>
            notificationService.createNotification({
              recipient: memberId,
              type: 'TASK_ASSIGNED',
              title: 'New Task Assigned',
              message: `You have been assigned the task "${updatedTask.title}" in project "${projectDoc?.title}".`,
              relatedEntity: { entityType: 'task', entityId: updatedTask._id },
            })
          );
          await Promise.all(notifPromises);
        } catch (notifErr) {
          console.error('[Notification] Task team update:', notifErr.message);
        }
      }
    }

    return updatedTask;
  }

  async updateTaskStatus(user, companyId, taskId, status) {
    this.ensureProjectPortalAccess(user);
    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");

    const userId = user.id || user._id;
    const userRole = getEffectiveProjectRole(user);
    const isProjectAdmin = userRole === 'project_administrator';
    const isProjectManager = userRole === 'project_manager';
    const isAssignee = task.team && task.team.some(member => {
        return member && member._id ? member._id.toString() === userId.toString() : member.toString() === userId.toString();
    });
    
    if (!isProjectAdmin && !isAssignee) {
      const Project = require('../models/projectSchema');
      const projectDoc = await Project.findOne({ _id: task.project, company: companyId }).lean();
      const isProjectOwner = projectDoc && projectDoc.owner && projectDoc.owner.toString() === userId.toString();
      if (!isProjectOwner) {
         throw new ForbiddenError("You do not have permission to update status for this task.");
      }
    }

    await this.validateTaskStatus(companyId, task.project, status);
    task.status = status;
    await task.save();

    require("./activityLogService").recordActivity({
      actorId: user.id || user._id,
      action: `updated task "${task.title}" to ${status}`,
      entityType: "task",
      entityId: task._id,
      companyId,
      level: "success",
    }).catch(() => {});

    return task;
  }

  async deleteTask(user, companyId, taskId) {
    this.ensureProjectPortalAccess(user);
    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");
    const userId = user.id || user._id;
    const userRole = getEffectiveProjectRole(user);
    const isProjectAdmin = userRole === 'project_administrator';
    const isProjectManager = userRole === 'project_manager';
    
    if (!isProjectAdmin) {
      if (!isProjectManager) {
        throw new ForbiddenError("Team members cannot delete tasks.");
      }
      const Project = require('../models/projectSchema');
      const projectDoc = await Project.findOne({ _id: task.project, company: companyId }).lean();
      const isProjectOwner = projectDoc && projectDoc.owner && projectDoc.owner.toString() === userId.toString();
      if (!isProjectOwner) {
         throw new ForbiddenError("Only project managers or administrators can delete tasks.");
      }
    }

    if (task.team && task.team.length > 0) {
      task.team.forEach(memberId => {
        notificationService.createNotification({
          recipient: memberId,
          type: 'TASK_DELETED',
          title: 'Task Removed',
          message: `Task "${task.title}" has been removed from the project.`,
          relatedEntity: { entityType: 'task', entityId: task._id },
        }).catch(console.error);
      });
    }

    require("./activityLogService").recordActivity({
      actorId: user.id || user._id,
      action: `deleted task "${task.title}"`,
      entityType: "task",
      entityId: task._id,
      companyId,
      level: "warning",
    }).catch(() => {});

    // Clean up dependencies references in other tasks
    await Task.updateMany(
      { project: task.project, company: companyId, dependencies: task._id },
      { $pull: { dependencies: task._id } }
    );

    await task.deleteOne();
  }

  async addAttachments(user, companyId, taskId, files) {
    if (!files || files.length === 0) {
      throw new BadRequestError("At least one file is required.");
    }

    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");

    const ProjectModel = require("../models/projectSchema");
    const projectDoc = await ProjectModel.findOne({ _id: task.project, company: companyId }).lean();
    this.assertCanModifyTask(user, companyId, task, projectDoc);

    const newAttachments = this.mapAttachments(files);
    task.attachments = [...(task.attachments || []), ...newAttachments];
    let savedTask;
    let attempts = 0;
    while (!savedTask && attempts < 3) {
      try {
        savedTask = await task.save();
      } catch (err) {
        if (err.code === 11000 && (err.keyPattern?.taskID || err.message?.includes("taskID"))) {
          attempts++;
          task.taskID = undefined;
          if (attempts >= 3) throw err;
        } else {
          throw err;
        }
      }
    }

    if (typeof savedTask.populate === "function") {
      try {
        await savedTask.populate("team", "name email avatar");
        await savedTask.populate("project", "title");
        await savedTask.populate("dependencies", "title status");
      } catch (e) {}
    }

    require("./activityLogService").recordActivity({
      actorId: user.id || user._id,
      action: `added ${newAttachments.length} attachment(s) to task "${task.title}"`,
      entityType: "task",
      entityId: task._id,
      companyId,
      level: "info",
    }).catch(() => {});

    return savedTask;
  }

  async deleteAttachment(user, companyId, taskId, attachmentId) {
    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");

    const ProjectModel = require("../models/projectSchema");
    const projectDoc = await ProjectModel.findOne({ _id: task.project, company: companyId }).lean();
    this.assertCanModifyTask(user, companyId, task, projectDoc);

    const attachment = (task.attachments || []).find(
      (att) => (att._id || att.id || '').toString() === attachmentId.toString() ||
               (att.public_id || att.blobName || '').toString() === attachmentId.toString()
    );

    if (!attachment) {
      throw new NotFoundError("Attachment");
    }

    if (attachment.blobName) {
      try {
        const { containerClient } = require("../config/azureConfig");
        if (containerClient) {
          const blockBlobClient = containerClient.getBlockBlobClient(attachment.blobName);
          await blockBlobClient.deleteIfExists();
        }
      } catch (blobErr) {
        console.warn("[Azure Storage] Failed to delete blob:", blobErr.message);
      }
    }

    const fileName = attachment.originalname || attachment.name || "attachment";
    task.attachments = task.attachments.filter(
      (att) => (att._id || att.id || '').toString() !== attachmentId.toString() &&
               (att.public_id || att.blobName || '').toString() !== attachmentId.toString()
    );

    let savedTask;
    let attempts = 0;
    while (!savedTask && attempts < 3) {
      try {
        savedTask = await task.save();
      } catch (err) {
        if (err.code === 11000 && (err.keyPattern?.taskID || err.message?.includes("taskID"))) {
          attempts++;
          task.taskID = undefined;
          if (attempts >= 3) throw err;
        } else {
          throw err;
        }
      }
    }

    if (typeof savedTask.populate === "function") {
      try {
        await savedTask.populate("team", "name email avatar");
        await savedTask.populate("project", "title");
        await savedTask.populate("dependencies", "title status");
      } catch (e) {}
    }

    require("./activityLogService").recordActivity({
      actorId: user.id || user._id,
      action: `removed attachment "${fileName}" from task "${task.title}"`,
      entityType: "task",
      entityId: task._id,
      companyId,
      level: "info",
    }).catch(() => {});

    return savedTask;
  }

  async renameAttachment(user, companyId, taskId, attachmentId, newName) {
    if (!newName || !newName.trim()) {
      throw new BadRequestError("Attachment name is required.");
    }

    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");

    const ProjectModel = require("../models/projectSchema");
    const projectDoc = await ProjectModel.findOne({ _id: task.project, company: companyId }).lean();
    this.assertCanModifyTask(user, companyId, task, projectDoc);

    const attachment = (task.attachments || []).find(
      (att) => (att._id || att.id || '').toString() === attachmentId.toString() ||
               (att.public_id || att.blobName || '').toString() === attachmentId.toString()
    );

    if (!attachment) {
      throw new NotFoundError("Attachment");
    }

    const cleanName = newName.trim();
    attachment.name = cleanName;
    attachment.originalname = cleanName;

    let savedTask;
    let attempts = 0;
    while (!savedTask && attempts < 3) {
      try {
        savedTask = await task.save();
      } catch (err) {
        if (err.code === 11000 && (err.keyPattern?.taskID || err.message?.includes("taskID"))) {
          attempts++;
          task.taskID = undefined;
          if (attempts >= 3) throw err;
        } else {
          throw err;
        }
      }
    }

    if (typeof savedTask.populate === "function") {
      try {
        await savedTask.populate("team", "name email avatar");
        await savedTask.populate("project", "title");
        await savedTask.populate("dependencies", "title status");
      } catch (e) {}
    }

    require("./activityLogService").recordActivity({
      actorId: user.id || user._id,
      action: `renamed attachment in task "${task.title}" to "${cleanName}"`,
      entityType: "task",
      entityId: task._id,
      companyId,
      level: "info",
    }).catch(() => {});

    return savedTask;
  }

  async addComment(user, companyId, taskId, data, files = []) {
    const userId = user.id || user._id;

    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");

    // Extract text / content
    let text = "";
    if (typeof data === "string") {
      text = data;
    } else if (data) {
      text = data.text || data.content || "";
    }

    // Parse replyTo if provided
    let replyTo = null;
    if (data?.replyTo) {
      try {
        replyTo = typeof data.replyTo === "string" ? JSON.parse(data.replyTo) : data.replyTo;
      } catch (err) {
        replyTo = null;
      }
    }

    // Process uploaded attachments
    const attachments = (files || []).map((file) => ({
      name: file.originalname || file.name,
      originalname: file.originalname || file.name,
      url: file.url || file.path,
      blobName: file.blobName || file.filename,
      size: file.size,
      format: file.mimetype || file.format,
      mimetype: file.mimetype,
    }));

    if (!text.trim() && attachments.length === 0) {
      throw new BadRequestError("Comment text or attachment is required");
    }

    const commentDoc = {
      user: userId,
      text: text.trim(),
      attachments,
      createdAt: new Date(),
    };

    if (replyTo && (replyTo.commentId || replyTo._id)) {
      commentDoc.replyTo = {
        commentId: replyTo.commentId || replyTo._id,
        text: replyTo.text || replyTo.content || "",
        userName: replyTo.userName || replyTo.author || replyTo.user?.name || "User",
        user: replyTo.userId || replyTo.user?._id || replyTo.user || undefined,
      };
    }

    task.comments.push(commentDoc);
    let savedTask;
    let attempts = 0;
    while (!savedTask && attempts < 3) {
      try {
        savedTask = await task.save();
      } catch (err) {
        if (err.code === 11000 && (err.keyPattern?.taskID || err.message?.includes("taskID"))) {
          attempts++;
          task.taskID = undefined;
          if (attempts >= 3) throw err;
        } else {
          throw err;
        }
      }
    }
    await savedTask.populate("comments.user", "name email avatar");
    await savedTask.populate("comments.replyTo.user", "name email avatar");

    require("./activityLogService").recordActivity({
      actorId: userId,
      action: `commented on task "${task.title}"`,
      entityType: "task",
      entityId: task._id,
      companyId,
      level: "info",
    }).catch(() => {});

    return savedTask.comments[savedTask.comments.length - 1];
  }

  async getProjectTasks(user, companyId, projectId) {
    this.ensureProjectPortalAccess(user);
    const userId = user.id || user._id;
    const userRole = getEffectiveProjectRole(user);
    const isProjectAdmin = userRole === 'project_administrator';

    const projectDoc = await Project.findOne({ _id: projectId, company: companyId }).lean();
    if (!projectDoc) throw new NotFoundError("Project");

    const isOwner = projectDoc.owner && projectDoc.owner.toString() === userId.toString();
    const isTeamMember = projectDoc.team && projectDoc.team.some(m => m.toString() === userId.toString());

    if (!isProjectAdmin && !isOwner && !isTeamMember) {
      throw new ForbiddenError("You do not have access to tasks in this project.");
    }

    return Task.find({ project: projectId, company: companyId })
      .populate("team", "name email avatar")
      .populate("dependencies", "title status")
      .populate("project", "title");
  }

  async getTaskComments(companyId, taskId) {
    const task = await Task.findOne({ _id: taskId, company: companyId })
      .select("comments")
      .populate("comments.user", "name email avatar")
      .populate("comments.replyTo.user", "name email avatar");
    if (!task) throw new NotFoundError("Task");
    return task.comments || [];
  }

  async deleteComment(user, companyId, taskId, commentId) {
    const userId = (user.id || user._id).toString();
    const userRole = getEffectiveProjectRole(user);
    const isProjectAdmin = userRole === "project_administrator";

    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");

    const commentIndex = task.comments.findIndex(
      (c) => c._id.toString() === commentId.toString()
    );
    if (commentIndex === -1) throw new NotFoundError("Comment");

    const comment = task.comments[commentIndex];
    const isAuthor = comment.user && comment.user.toString() === userId;

    if (!isProjectAdmin && !isAuthor) {
      throw new ForbiddenError("You are not authorized to delete this comment");
    }

    task.comments.splice(commentIndex, 1);
    await task.save();

    require("./activityLogService").recordActivity({
      actorId: userId,
      action: `deleted comment on task "${task.title}"`,
      entityType: "task",
      entityId: task._id,
      companyId,
      level: "info",
    }).catch(() => {});

    return { message: "Comment deleted successfully", commentId };
  }

  async getUserTasks(user, companyId) {
    this.ensureProjectPortalAccess(user);
    const userId = user.id || user._id;

    // My Tasks must only return tasks assigned to the user (or created by user)
    const filter = {
      company: companyId,
      $or: [{ team: userId }, { createdBy: userId }],
    };

    return Task.find(filter)
      .populate("team", "name email avatar")
      .populate("dependencies", "title status")
      .populate("project", "title")
      .sort({ createdAt: -1 });
  }
}

module.exports = new TaskService();
