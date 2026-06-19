const todoService = require("../services/todoService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.getUserTodos = catchAsync(async (req, res) => {
  const todos = await todoService.getUserTodos(req.user, req.params.id);
  res.status(200).json(ApiResponse.success(todos, "Todos retrieved successfully"));
});

exports.createTodo = catchAsync(async (req, res) => {
  const todo = await todoService.createTodo(req.user, req.params.id, req.body);
  res.status(201).json(ApiResponse.success(todo, "Todo created successfully"));
});

exports.updateTodo = catchAsync(async (req, res) => {
  const todo = await todoService.updateTodo(req.user, req.params.id, req.params.todoId, req.body);
  res.status(200).json(ApiResponse.success(todo, "Todo updated successfully"));
});

exports.deleteTodo = catchAsync(async (req, res) => {
  const todo = await todoService.deleteTodo(req.user, req.params.id, req.params.todoId);
  res.status(200).json(ApiResponse.success(todo, "Todo deleted successfully"));
});
