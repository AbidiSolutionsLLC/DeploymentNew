const Task = require("../models/taskSchema");
const Project = require("../models/projectSchema");
const { NotFoundError, BadRequestError } = require("../utils/ExpressError");
const { createNotification } = require('../utils/notificationService');

class TaskService {
  async createTask(companyId, data) {
    const { title, description, project, team, priority, dueDate, duration } = data;

    const projectExists = await Project.findOne({ _id: project, company: companyId });
    if (!projectExists) throw new NotFoundError("Project");

    const task = new Task({
      title,
      description,
      project,
      team,
      priority,
      dueDate,
      duration,
      company: companyId,
    });

    const savedTask = await task.save();

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
      .populate("comments.user", "name email avatar");

    if (!task) throw new NotFoundError("Task");
    return task;
  }

  async updateTask(companyId, taskId, data) {
    const {
      title, description, team, priority, dueDate, duration,
      completionPercent, workedHours, status
    } = data;

    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");

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

    const updatedTask = await task.save();

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

  async updateTaskStatus(companyId, taskId, status) {
    const task = await Task.findOneAndUpdate(
      { _id: taskId, company: companyId },
      { status },
      { new: true, runValidators: true }
    );

    if (!task) throw new NotFoundError("Task");
    return task;
  }

  async deleteTask(companyId, taskId) {
    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");

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

    await task.deleteOne();
  }

  async addComment(user, companyId, taskId, text) {
    const userId = user.id || user._id;

    const task = await Task.findOne({ _id: taskId, company: companyId });
    if (!task) throw new NotFoundError("Task");

    task.comments.push({ user: userId, text });
    return task.save();
  }

  async getProjectTasks(companyId, projectId) {
    return Task.find({ project: projectId, company: companyId })
      .populate("team", "name email avatar")
      .populate("project", "title");
  }

  async getUserTasks(user, companyId) {
    const userId = user.id || user._id;
    return Task.find({ team: userId, company: companyId })
      .populate("team", "name email avatar")
      .populate("project", "title");
  }
}

module.exports = new TaskService();
