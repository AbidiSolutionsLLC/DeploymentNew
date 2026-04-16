const Todo = require("../models/todoSchema");
const User = require("../models/userSchema");
const catchAsync = require("../utils/catchAsync");
const {
  ForbiddenError,
  NotFoundError,
} = require("../utils/ExpressError");

const ADMIN_ROLES = ["Super Admin", "Admin", "HR", "Manager"];

const getActorId = (user) => user?._id || user?.id;

const canAccessTodos = (actor, targetUserId) => {
  if (!actor) return false;
  if (String(getActorId(actor)) === String(targetUserId)) return true;
  return ADMIN_ROLES.includes(actor.role);
};

const ensureTodoAccess = async (req, userId) => {
  if (!canAccessTodos(req.user, userId)) {
    throw new ForbiddenError("You do not have permission to access these todos.");
  }

  const user = await User.findById(userId).select("_id");
  if (!user) throw new NotFoundError("User not found");
};

exports.getUserTodos = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ensureTodoAccess(req, id);

  const todos = await Todo.find({ user: id }).sort({
    completed: 1,
    dueDate: 1,
    createdAt: -1,
  });

  res.status(200).json(todos);
});

exports.createTodo = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ensureTodoAccess(req, id);

  const todo = await Todo.create({
    user: id,
    title: req.body.title,
    description: req.body.description,
    dueDate: req.body.dueDate,
    completed: req.body.completed ?? false,
  });

  res.status(201).json(todo);
});

exports.updateTodo = catchAsync(async (req, res) => {
  const { id, todoId } = req.params;
  await ensureTodoAccess(req, id);

  const todo = await Todo.findOne({ _id: todoId, user: id });
  if (!todo) throw new NotFoundError("Todo not found");

  if (req.body.title !== undefined) todo.title = req.body.title;
  if (req.body.description !== undefined) todo.description = req.body.description;
  if (req.body.dueDate !== undefined) todo.dueDate = req.body.dueDate;
  if (req.body.completed !== undefined) todo.completed = req.body.completed;

  await todo.save();

  res.status(200).json(todo);
});

exports.deleteTodo = catchAsync(async (req, res) => {
  const { id, todoId } = req.params;
  await ensureTodoAccess(req, id);

  const todo = await Todo.findOneAndDelete({ _id: todoId, user: id });
  if (!todo) throw new NotFoundError("Todo not found");

  res.status(200).json({
    status: "success",
    message: "Todo deleted successfully",
    data: todo,
  });
});
