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
  })).optional()
});

const projectUpdateSchema = projectSchema.fork(["department"], schema => schema.optional());

module.exports = { projectSchema, projectUpdateSchema };
