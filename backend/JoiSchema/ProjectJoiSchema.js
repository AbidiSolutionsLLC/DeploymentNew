const Joi = require("joi");

const projectSchema = Joi.object({
  title: Joi.string().trim().min(1).max(150).required().messages({
    'string.empty': 'Project title is required.',
    'string.min': 'Project title must be at least 1 character.',
    'any.required': 'Project title is required.'
  }),
  description: Joi.string().trim().allow("", null),
  team: Joi.array().items(Joi.string()).optional(),
  // Keep in sync with models/projectSchema.js status enum
  status: Joi.string()
    .valid("Planning", "Active", "On Hold", "Completed", "Cancelled")
    .optional()
    .messages({
      "any.only": "Status must be one of: Planning, Active, On Hold, Completed, Cancelled.",
    }),
  strict: Joi.boolean().optional(),
  isPublic: Joi.boolean().optional(),
  startDate: Joi.date().allow(null, "").optional(),
  dueDate: Joi.date().allow(null, "").optional(),
  owner: Joi.string().optional(),
  department: Joi.string().required().messages({
    "any.required": "Department is required."
  }),
  projectGroup: Joi.string().allow(null, "").optional(),
  milestones: Joi.array().items(Joi.object({
    title: Joi.string().trim().min(1).max(150).required(),
    dueDate: Joi.date().allow(null, "").optional(),
    status: Joi.string().valid("Planned", "In Progress", "Completed").optional()
  }).unknown(true)).optional(),
  statusOrder: Joi.array().items(Joi.string().trim().min(1).max(50)).optional(),
  statuses: Joi.array().items(
    Joi.object({
      _id: Joi.any().optional(),
      id: Joi.string().allow(null, '').optional(),
      label: Joi.string().trim().min(1).max(50).required(),
      order: Joi.number().integer().min(0).optional(),
      color: Joi.string().allow(null, '').optional(),
      category: Joi.string().valid("backlog", "todo", "in_progress", "in_review", "done").optional(),
      isDefault: Joi.boolean().optional(),
    }).unknown(true)
  ).optional(),
  reassignTasks: Joi.array().items(
    Joi.object({
      fromStatus: Joi.string().trim().min(1).max(50).required(),
      toStatus: Joi.string().trim().min(1).max(50).required(),
    })
  ).optional(),
  customStatuses: Joi.array().items(
    Joi.object({
      _id: Joi.any().optional(),
      id: Joi.any().optional(),
      label: Joi.string().trim().min(1).max(50).required(),
      order: Joi.number().integer().min(0).optional(),
      color: Joi.string().allow(null, '').optional(),
    }).unknown(true)
  ).optional()
});

const projectUpdateSchema = projectSchema.fork(["department", "title"], schema => schema.optional());

module.exports = { projectSchema, projectUpdateSchema };
