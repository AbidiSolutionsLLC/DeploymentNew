const Joi = require("joi");

const projectSchema = Joi.object({
  title: Joi.string().trim().min(1).max(150).required().messages({
    'string.empty': 'Project title is required.',
    'string.min': 'Project title must be at least 1 character.',
    'any.required': 'Project title is required.'
  }),
  description: Joi.string().trim().allow("", null),
  team: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid("Not Started", "In Progress", "Completed", "On Hold", "Cancelled").optional(),
  strict: Joi.boolean().optional(),
  isPublic: Joi.boolean().optional(),
  startDate: Joi.date().allow(null, "").optional(),
  dueDate: Joi.date().allow(null, "").optional()
});

module.exports = { projectSchema };
