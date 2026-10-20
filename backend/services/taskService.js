const Task = require("../models/taskSchema");
const Project = require("../models/projectSchema");
const User = require("../models/userSchema");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../utils/ExpressError");
const { createNotification } = require('../utils/notificationService');

class TaskService {
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
    const { title, description, project, team, priority, status, dueDate, duration, completionPercent, workedHours, dependencies } = data;
    const userId = user?.id || user?._id;

    const projectExists = await Project.findOne({ _id: project, company: companyId });
    if (!projectExists) throw new NotFoundError("Project");
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

  async getAllTasks(companyId, query) {
    const { page = 1, limit = 20, search = '', project, status, priority, assignee } = query;
    const skip = (page - 1) * limit;

    const filter = {
      company: companyId,
      ...(project && { project }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assignee && { team: assignee }),
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
      .populate("comments.user", "name email avatar");

    if (!task) throw new NotFoundError("Task");
    return task;
  }

  async updateTask(user, companyId, taskId, data, files) {
    const {
      title, description, team, priority, dueDate, duration,
      completionPercent,       workedHours, status, dependencies
    } = data;

    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");
    await this.validateCompanyTeam(companyId, team);
    const validDependencies = dependencies !== undefined
      ? await this.validateDependencies(companyId, task.project, taskId, dependencies)
      : task.dependencies;

    const userRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = userRole === 'admin';
    const isManagerTech = userRole === 'manager' && user.isTechnician;
    const isAssignee = task.team && task.team.some(member => {
        return member && member._id ? member._id.toString() === (user.id || user._id).toString() : member.toString() === (user.id || user._id).toString();
    });
    
    if (!isSuperAdmin && !isAdmin && !isManagerTech && !isAssignee) {
      const Project = require('../models/projectSchema');
      const projectDoc = await Project.findOne({ _id: task.project, company: companyId }).lean();
      const isProjectOwner = projectDoc && projectDoc.owner && projectDoc.owner.toString() === (user.id || user._id).toString();
      if (!isProjectOwner) {
         throw new ForbiddenError("You do not have permission to access or modify this task.");
      }
    }

    const previousTeam = task.team.map(id => id.toString());
    
    task.title = title || task.title;
    task.description = description || task.description;
    task.team = team || task.team;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;
    task.duration = duration || task.duration;
    task.completionPercent = completionPercent !== undefined ? completionPercent : task.completionPercent;
    task.workedHours = workedHours !== undefined ? workedHours : task.workedHours;
    task.status = status || task.status;
    task.dependencies = validDependencies;
    if (files?.length) {
      task.attachments = [...(task.attachments || []), ...this.mapAttachments(files)];
    }

    const updatedTask = await task.save();

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
    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");

    const userRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = userRole === 'admin';
    const isManagerTech = userRole === 'manager' && user.isTechnician;
    const isAssignee = task.team && task.team.some(member => {
        return member && member._id ? member._id.toString() === (user.id || user._id).toString() : member.toString() === (user.id || user._id).toString();
    });
    
    if (!isSuperAdmin && !isAdmin && !isManagerTech && !isAssignee) {
      const Project = require('../models/projectSchema');
      const projectDoc = await Project.findOne({ _id: task.project, company: companyId }).lean();
      const isProjectOwner = projectDoc && projectDoc.owner && projectDoc.owner.toString() === (user.id || user._id).toString();
      if (!isProjectOwner) {
         throw new ForbiddenError("You do not have permission to access or modify this task.");
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
    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");

    const userRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = userRole === 'admin';
    const isManagerTech = userRole === 'manager' && user.isTechnician;
    
    if (!isSuperAdmin && !isAdmin && !isManagerTech) {
      const Project = require('../models/projectSchema');
      const projectDoc = await Project.findOne({ _id: task.project, company: companyId }).lean();
      const isProjectOwner = projectDoc && projectDoc.owner && projectDoc.owner.toString() === (user.id || user._id).toString();
      if (!isProjectOwner) {
         throw new ForbiddenError("You do not have permission to delete this task.");
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

  async addComment(user, companyId, taskId, text) {
    const userId = user.id || user._id;

    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");

    task.comments.push({ user: userId, text });
    const savedTask = await task.save();
    await savedTask.populate("comments.user", "name email avatar");
    require("./activityLogService").recordActivity({
      actorId: userId,
      action: `commented on task "${task.title}"`,
      entityType: "task",
      entityId: task._id,
      companyId,
      level: "info",
    });
    return savedTask.comments[savedTask.comments.length - 1];
  }

  async getProjectTasks(companyId, projectId) {
    return Task.find({ project: projectId, company: companyId })
      .populate("team", "name email avatar")
      .populate("dependencies", "title status")
      .populate("project", "title");
  }

  async getTaskComments(companyId, taskId) {
    const task = await Task.findOne({ _id: taskId, company: companyId })
      .select("comments")
      .populate("comments.user", "name email avatar");
    if (!task) throw new NotFoundError("Task");
    return task.comments || [];
  }

  async getUserTasks(user, companyId) {
    const userId = user.id || user._id;
    const userRole = (user.role || "").replace(/\s+/g, "").toLowerCase();
    const isPrivileged =
      userRole === "superadmin" ||
      userRole === "admin" ||
      (userRole === "manager" && user.isTechnician);

    // Privileged roles run the command center and need visibility of every task
    // in the company. Everyone else sees tasks assigned to or created by them.
    const filter = isPrivileged
      ? { company: companyId }
      : {
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
