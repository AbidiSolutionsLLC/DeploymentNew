const taskService = require("../services/taskService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask(req.user, req.companyId, req.body, req.files);
  res.status(201).json(ApiResponse.success(task, 'Task created successfully'));
});

exports.getAllTasks = catchAsync(async (req, res) => {
  const result = await taskService.getAllTasks(req.user, req.companyId, req.query);
  res.status(200).json(ApiResponse.success(result.data, 'Tasks retrieved successfully', result.pagination));
});

exports.getTaskById = catchAsync(async (req, res) => {
  const task = await taskService.getTaskById(req.user, req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(task, 'Task retrieved successfully'));
});

exports.updateTask = catchAsync(async (req, res) => {
  const updatedTask = await taskService.updateTask(req.user, req.companyId, req.params.id, req.body, req.files);
  res.status(200).json(ApiResponse.success(updatedTask, 'Task updated successfully'));
});

exports.updateTaskStatus = catchAsync(async (req, res) => {
  const task = await taskService.updateTaskStatus(req.user, req.companyId, req.params.id, req.body.status);
  res.status(200).json(ApiResponse.success(task, 'Task status updated'));
});

exports.deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(req.user, req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(null, "Task deleted successfully"));
});

exports.addComment = catchAsync(async (req, res) => {
  const comment = await taskService.addComment(req.user, req.companyId, req.params.id, req.body, req.files);
  res.status(200).json(ApiResponse.success(comment, 'Comment added successfully'));
});

exports.getTaskComments = catchAsync(async (req, res) => {
  const comments = await taskService.getTaskComments(req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(comments, "Task comments retrieved successfully"));
});

exports.deleteComment = catchAsync(async (req, res) => {
  const result = await taskService.deleteComment(req.user, req.companyId, req.params.id, req.params.commentId);
  res.status(200).json(ApiResponse.success(result, 'Comment deleted successfully'));
});

exports.getProjectTasks = catchAsync(async (req, res) => {
  const tasks = await taskService.getProjectTasks(req.user, req.companyId, req.params.projectId);
  res.status(200).json(ApiResponse.success(tasks, 'Project tasks retrieved successfully'));
});

exports.getUserTasks = catchAsync(async (req, res) => {
  const tasks = await taskService.getUserTasks(req.user, req.companyId);
  res.status(200).json(ApiResponse.success(tasks, 'User tasks retrieved successfully'));
});
