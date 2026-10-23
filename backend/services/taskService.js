const Task = require("../models/taskSchema");
const Project = require("../models/projectSchema");
const User = require("../models/userSchema");
const { NotFoundError, BadRequestError, ForbiddenError, UnauthorizedError } = require("../utils/ExpressError");
const { getEffectiveProjectRole, hasProjectPortalAccess } = require("../utils/projectRbac");
const { createNotification } = require('../utils/notificationService');

class TaskService {
  ensureProjectPortalAccess(user) {
    if (!hasProjectPortalAccess(user)) {
      throw new ForbiddenError("You do not have access to the Project Portal.");
    }
  }

  async validateCompanyTeam(companyId, team) {
    if (!team || !team.length) return;
    const count = await User.countDocuments({ _id: { $in: team }, company: companyId });
    if (count !== new Set(team.map(String)).size) {
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
      public_id: file.blobName || file.filename,
      url: file.url || file.path,
      originalname: file.originalname,
      format: file.mimetype,
      size: file.size
    }));
  }

  async createTask(user, companyId, data, files) {
    this.ensureProjectPortalAccess(user);
    const userId = user?.id || user?._id;
    const userRole = getEffectiveProjectRole(user);

    if (userRole !== 'project_administrator' && userRole !== 'project_manager') {
      throw new ForbiddenError("Team members cannot create new tasks.");
    }

    const { title, description, project, team, priority, status, dueDate, duration, completionPercent, workedHours, dependencies } = data;

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
    const validDependencies = await this.validateDependencies(companyId, project, null, dependencies);

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

    const savedTask = await task.save();

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
          createNotification({
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
      title, description, team, priority, dueDate, duration,
      completionPercent,       workedHours, status, dependencies
    } = data;

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
        const teamChanged = team !== undefined && JSON.stringify(team.map(String)) !== JSON.stringify(task.team.map(String));
        const priorityChanged = priority !== undefined && priority !== task.priority;
        const dueChanged = dueDate !== undefined && (new Date(dueDate).getTime() !== (task.dueDate ? new Date(task.dueDate).getTime() : null));
        const durationChanged = duration !== undefined && Number(duration) !== Number(task.duration);
        const depChanged = dependencies !== undefined && JSON.stringify((dependencies || []).map(String)) !== JSON.stringify((task.dependencies || []).map(String));

        if (teamChanged || priorityChanged || dueChanged || durationChanged || depChanged) {
          throw new ForbiddenError("Team members can only update task status, progress percentage, worked hours, and description.");
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

    if (team !== undefined) {
      await this.validateCompanyTeam(companyId, team);
    }
    const validDependencies = dependencies !== undefined
      ? await this.validateDependencies(companyId, task.project, taskId, dependencies)
      : task.dependencies;

    const previousTeam = task.team.map(id => id.toString());
    
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
    if (files?.length) {
      task.attachments = [...(task.attachments || []), ...this.mapAttachments(files)];
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("team", "name email avatar")
      .populate("project", "title")
      .populate("dependencies", "title status");

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
            createNotification({
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
        createNotification({
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

    await task.deleteOne();
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
    const savedTask = await task.save();
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
