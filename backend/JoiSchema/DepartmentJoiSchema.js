const Joi = require("joi");

const departmentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Department name is required.',
    'string.min': 'Department name must be at least 2 characters.',
    'string.max': 'Department name cannot exceed 100 characters.',
    'any.required': 'Department name is required.'
  }),
  manager: Joi.string().allow("", null),
  parentDepartment: Joi.string().allow("", null),
  description: Joi.string().trim().max(1000).allow("", null).messages({
    'string.max': 'Description cannot exceed 1000 characters.'
  })
});

module.exports = { departmentSchema };
