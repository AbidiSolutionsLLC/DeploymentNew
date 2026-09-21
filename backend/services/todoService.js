const Todo = require("../models/todoSchema");
const User = require("../models/userSchema");
const { ForbiddenError, NotFoundError } = require("../utils/ExpressError");

const ADMIN_ROLES = ["Super Admin", "Admin", "HR", "Manager"];

class TodoService {
  getActorId(user) {
    return user?._id || user?.id;
  }

  async ensureTodoAccess(user, targetUserId) {
    if (!user) throw new ForbiddenError("You do not have permission to access these todos.");
    if (String(this.getActorId(user)) === String(targetUserId)) return; // Self access is allowed

    const targetUser = await User.findById(targetUserId).select("_id role");
    if (!targetUser) throw new NotFoundError("User not found");

    const roleWeights = {
      'superadmin': 4,
      'admin': 3,
      'hr': 2,
      'manager': 2,
      'technician': 1,
      'employee': 1
    };

    const actorRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
    const targetRole = (targetUser.role || '').replace(/\s+/g, '').toLowerCase();

    if (actorRole === 'superadmin') return; // Super admin can access anyone

    if (roleWeights[actorRole] > roleWeights[targetRole]) return; // Higher role can access lower role

    throw new ForbiddenError("You do not have permission to access these todos.");
  }

  async getUserTodos(user, targetUserId) {
    await this.ensureTodoAccess(user, targetUserId);

    return Todo.find({ user: targetUserId }).sort({
      completed: 1,
      dueDate: 1,
      createdAt: -1,
    });
  }

  async createTodo(user, targetUserId, data) {
    await this.ensureTodoAccess(user, targetUserId);

    return Todo.create({
      user: targetUserId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      completed: data.completed ?? false,
    });
  }

  async updateTodo(user, targetUserId, todoId, data) {
    await this.ensureTodoAccess(user, targetUserId);

    const todo = await Todo.findOne({ _id: todoId, user: targetUserId });
    if (!todo) throw new NotFoundError("Todo not found");

    if (data.title !== undefined) todo.title = data.title;
    if (data.description !== undefined) todo.description = data.description;
    if (data.dueDate !== undefined) todo.dueDate = data.dueDate;
    if (data.completed !== undefined) todo.completed = data.completed;

    return todo.save();
  }

  async deleteTodo(user, targetUserId, todoId) {
    await this.ensureTodoAccess(user, targetUserId);

    const todo = await Todo.findOneAndDelete({ _id: todoId, user: targetUserId });
    if (!todo) throw new NotFoundError("Todo not found");

    return todo;
  }
}

module.exports = new TodoService();
