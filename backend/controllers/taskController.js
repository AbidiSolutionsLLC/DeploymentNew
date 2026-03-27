// taskController.js
const Task = require("../models/taskSchema");
const Project = require("../models/projectSchema");
const catchAsync = require("../utils/catchAsync");
const { NotFoundError, BadRequestError } = require("../utils/ExpressError");
const { createNotification } = require('../utils/notificationService');

// Create Task
exports.createTask = catchAsync(async (req, res) => {
  const { title, description, project, team, priority, dueDate, duration } = req.body;

  // Verify project exists
  const projectExists = await Project.findById(project);
  if (!projectExists) throw new NotFoundError("Project");

  const task = new Task({
    title,
    description,
    project,
    team,
    priority,
    dueDate,
    duration,
  });

  const savedTask = await task.save();

  // Notify all team members they've been assigned to this task
  if (savedTask.team && savedTask.team.length > 0) {
    const projectDoc = await Project.findById(savedTask.project).select('title').lean();
    const projectName = projectDoc?.title || 'a project';
    try {
      const notifPromises = savedTask.team.map(memberId =>
        createNotification({
          recipient: memberId,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You have been assigned the task "${savedTask.title}" in project "${projectName}".`,
          relatedEntity: { entityType: 'task', entityId: savedTask._id },
        })
      );
      await Promise.all(notifPromises);
    } catch (notifErr) {
      console.error('[Notification] Task created:', notifErr.message);
    }
  }

  res.status(201).json(savedTask);
});

// Get All Tasks
exports.getAllTasks = catchAsync(async (req, res) => {
  const tasks = await Task.find().populate("team", "name email").populate("project", "title");
  res.status(200).json(tasks);
});

// Get Task by ID
exports.getTaskById = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate("team", "name email")
    .populate("project", "title")
    .populate("comments.user", "name email");

  if (!task) throw new NotFoundError("Task");

  res.status(200).json(task);
});

// Update Task
exports.updateTask = catchAsync(async (req, res) => {
  const {
    title,
    description,
    team,
    priority,
    dueDate,
    duration,
    completionPercent,
    workedHours,
    status,
  } = req.body;

  const task = await Task.findById(req.params.id);
  if (!task) throw new NotFoundError("Task");

  const previousTeam = task.team.map(id => id.toString());
  const previousStatus = task.status;

  // Update fields
  task.title = title || task.title;
  task.description = description || task.description;
  task.team = team || task.team;
  task.priority = priority || task.priority;
  task.dueDate = dueDate || task.dueDate;
  task.duration = duration || task.duration;
  task.completionPercent = completionPercent || task.completionPercent;
  task.workedHours = workedHours || task.workedHours;
  task.status = status || task.status;

  const updatedTask = await task.save();

  // Notify newly added team members (TASK_ASSIGNED)
  if (team && team.length > 0) {
    const newMembers = team.filter(id => !previousTeam.includes(id.toString()));
    if (newMembers.length > 0) {
      const projectDoc = await Project.findById(updatedTask.project).select('title').lean();
      const projectName = projectDoc?.title || 'a project';
      try {
        const notifPromises = newMembers.map(memberId =>
          createNotification({
            recipient: memberId,
            type: 'TASK_ASSIGNED',
            title: 'New Task Assigned',
            message: `You have been assigned the task "${updatedTask.title}" in project "${projectName}".`,
            relatedEntity: { entityType: 'task', entityId: updatedTask._id },
          })
        );
        await Promise.all(notifPromises);
      } catch (notifErr) {
        console.error('[Notification] Task team update:', notifErr.message);
      }
    }
  }

  // Notify team on status change (TASK_STATUS_CHANGED)
  if (status && status !== previousStatus && updatedTask.team && updatedTask.team.length > 0) {
    try {
      const notifPromises = updatedTask.team.map(memberId =>
        createNotification({
          recipient: memberId,
          type: 'TASK_STATUS_CHANGED',
          title: 'Task Status Updated',
          message: `Task "${updatedTask.title}" status has been updated to "${status}".`,
          relatedEntity: { entityType: 'task', entityId: updatedTask._id },
        })
      );
      await Promise.all(notifPromises);
    } catch (notifErr) {
      console.error('[Notification] Task status change:', notifErr.message);
    }
  }

  res.status(200).json(updatedTask);
});

// Delete Task
exports.deleteTask = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new NotFoundError("Task");

  await task.deleteOne();
  res.status(200).json({ message: "Task deleted successfully" });
});

// Add Comment to Task
exports.addComment = catchAsync(async (req, res) => {
  const { text } = req.body;
  const userId = req.user.id || req.user._id;

  const task = await Task.findById(req.params.id);
  if (!task) throw new NotFoundError("Task");

  task.comments.push({
    user: userId,
    text,
  });

  const updatedTask = await task.save();
  res.status(200).json(updatedTask);
});

// Get Tasks for Project
exports.getProjectTasks = catchAsync(async (req, res) => {
  const tasks = await Task.find({ project: req.params.projectId })
    .populate("team", "name email")
    .populate("project", "title");

  res.status(200).json(tasks);
});

// Get Tasks for User
exports.getUserTasks = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id;

  const tasks = await Task.find({ team: userId })
    .populate("team", "name email")
    .populate("project", "title");

  res.status(200).json(tasks);
});