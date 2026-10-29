const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Task title is required.',
    'string.min': 'Task title must be at least 1 character.',
    'any.required': 'Task title is required.'
  }),
  description: Joi.string().trim().allow("", null),
  project: Joi.string().required().messages({
    'string.empty': 'Project ID is required.',
    'any.required': 'Project ID is required.'
  }),
  team: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  assignees: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  assignee: Joi.string().allow("", null).optional(),
  dependencies: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  priority: Joi.string().valid("Low", "Medium", "High").optional(),
  status: Joi.string().trim().min(1).max(100).optional(),
  dueDate: Joi.date().allow(null, "").optional(),
  duration: Joi.number().min(0).allow(null).optional(),
  completionPercent: Joi.number().min(0).max(100).optional(),
  workedHours: Joi.number().min(0).optional(),
  attachments: Joi.any().optional(),
  files: Joi.any().optional()
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().trim().min(1).optional(),
  description: Joi.string().trim().allow("", null).optional(),
  team: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  assignees: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  assignee: Joi.string().allow("", null).optional(),
  dependencies: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  priority: Joi.string().valid("Low", "Medium", "High").optional(),
  status: Joi.string().trim().min(1).max(100).optional(),
  dueDate: Joi.date().allow(null, "").optional(),
  duration: Joi.number().min(0).allow(null).optional(),
  completionPercent: Joi.number().min(0).max(100).optional(),
  workedHours: Joi.number().min(0).optional(),
  attachments: Joi.any().optional(),
  files: Joi.any().optional(),
  deletedAttachmentIds: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  renamedAttachments: Joi.alternatives().try(Joi.array(), Joi.string()).optional()
});

const taskStatusSchema = Joi.object({
  status: Joi.string().trim().min(1).max(100).required()
});

const attachmentRenameSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Attachment name is required.',
    'any.required': 'Attachment name is required.'
  })
});

module.exports = { taskSchema, taskUpdateSchema, taskStatusSchema, attachmentRenameSchema };
