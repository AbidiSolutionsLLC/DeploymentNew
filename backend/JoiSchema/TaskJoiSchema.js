const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(150).required().messages({
    'string.empty': 'Task title is required.',
    'string.min': 'Task title must be at least 1 character.',
    'any.required': 'Task title is required.'
  }),
  description: Joi.string().trim().allow("", null),
  project: Joi.string().required().messages({
    'string.empty': 'Project ID is required.',
    'any.required': 'Project ID is required.'
  }),
  team: Joi.array().items(Joi.string()).optional(),
  assignees: Joi.array().items(Joi.string()).optional(),
  assignee: Joi.string().allow("", null).optional(),
  dependencies: Joi.array().items(Joi.string()).optional(),
  priority: Joi.string().valid("Low", "Medium", "High").optional(),
  status: Joi.string().trim().min(1).max(100).optional(),
  dueDate: Joi.date().allow(null, "").optional(),
  duration: Joi.number().min(0).allow(null).optional(),
  completionPercent: Joi.number().min(0).max(100).optional(),
  workedHours: Joi.number().min(0).optional()
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(150).optional(),
  description: Joi.string().trim().allow("", null).optional(),
  team: Joi.array().items(Joi.string()).optional(),
  assignees: Joi.array().items(Joi.string()).optional(),
  assignee: Joi.string().allow("", null).optional(),
  dependencies: Joi.array().items(Joi.string()).optional(),
  priority: Joi.string().valid("Low", "Medium", "High").optional(),
  status: Joi.string().trim().min(1).max(100).optional(),
  dueDate: Joi.date().allow(null, "").optional(),
  duration: Joi.number().min(0).allow(null).optional(),
  completionPercent: Joi.number().min(0).max(100).optional(),
  workedHours: Joi.number().min(0).optional()
});

const taskStatusSchema = Joi.object({
  status: Joi.string().trim().min(1).max(100).required()
});

module.exports = { taskSchema, taskUpdateSchema, taskStatusSchema };
