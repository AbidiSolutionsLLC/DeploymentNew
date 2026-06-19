const Joi = require("joi");

const baseTodoFields = {
  title: Joi.string().trim().min(1).max(200).required().messages({
    "string.empty": "Task name is required.",
    "any.required": "Task name is required.",
  }),
  description: Joi.string().trim().allow("", null),
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
