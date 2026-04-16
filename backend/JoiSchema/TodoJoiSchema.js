const Joi = require("joi");

const baseTodoFields = {
  title: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Task name is required.",
    "string.min": "Task name must be at least 3 characters.",
    "string.max": "Task name cannot exceed 100 characters.",
    "any.required": "Task name is required.",
  }),
  description: Joi.string().trim().min(3).max(500).required().messages({
    "string.empty": "Task description is required.",
    "string.min": "Task description must be at least 3 characters.",
    "string.max": "Task description cannot exceed 500 characters.",
    "any.required": "Task description is required.",
  }),
  dueDate: Joi.date().required().messages({
    "date.base": "A valid due date is required.",
    "any.required": "Due date is required.",
  }),
  completed: Joi.boolean().optional(),
};

const createTodoSchema = Joi.object(baseTodoFields);

const updateTodoSchema = Joi.object({
  title: baseTodoFields.title.optional(),
  description: baseTodoFields.description.optional(),
  dueDate: baseTodoFields.dueDate.optional(),
  completed: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createTodoSchema,
  updateTodoSchema,
};
