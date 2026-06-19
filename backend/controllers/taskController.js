const taskService = require("../services/taskService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask(req.companyId, req.body);
  res.status(201).json(ApiResponse.success(task, 'Task created successfully'));
});

exports.getAllTasks = catchAsync(async (req, res) => {
  const result = await taskService.getAllTasks(req.companyId, req.query);
  res.status(200).json(ApiResponse.success(result.data, 'Tasks retrieved successfully', result.pagination));
});

exports.getTaskById = catchAsync(async (req, res) => {
  const task = await taskService.getTaskById(req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(task, 'Task retrieved successfully'));
});

exports.updateTask = catchAsync(async (req, res) => {
  const updatedTask = await taskService.updateTask(req.companyId, req.params.id, req.body);
  res.status(200).json(ApiResponse.success(updatedTask, 'Task updated successfully'));
});

exports.updateTaskStatus = catchAsync(async (req, res) => {
  const task = await taskService.updateTaskStatus(req.companyId, req.params.id, req.body.status);
  res.status(200).json(ApiResponse.success(task, 'Task status updated'));
});

exports.deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(null, "Task deleted successfully"));
});

exports.addComment = catchAsync(async (req, res) => {
  const task = await taskService.addComment(req.user, req.companyId, req.params.id, req.body.text);
  res.status(200).json(ApiResponse.success(task, 'Comment added successfully'));
});

exports.getProjectTasks = catchAsync(async (req, res) => {
  const tasks = await taskService.getProjectTasks(req.companyId, req.params.projectId);
  res.status(200).json(ApiResponse.success(tasks, 'Project tasks retrieved successfully'));
});

exports.getUserTasks = catchAsync(async (req, res) => {
  const tasks = await taskService.getUserTasks(req.user, req.companyId);
  res.status(200).json(ApiResponse.success(tasks, 'User tasks retrieved successfully'));
});