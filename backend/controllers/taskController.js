// taskController.js
const Task = require("../models/taskSchema");
const Project = require("../models/projectSchema");
const catchAsync = require("../utils/catchAsync");
const { NotFoundError, BadRequestError } = require("../utils/ExpressError");

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
  const userId = req.user._id;

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
  const userId = req.user._id;

  const tasks = await Task.find({ team: userId })
    .populate("team", "name email")
    .populate("project", "title");

  res.status(200).json(tasks);
});