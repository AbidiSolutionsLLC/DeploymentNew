const Joi = require("joi");

const departmentSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.empty': 'Department name is required.',
      'string.min': 'Department name must be at least 2 characters.',
      'string.max': 'Department name cannot exceed 50 characters.',
      'string.pattern.base': 'Department name can only contain letters, spaces, hyphens, and apostrophes.',
      'any.required': 'Department name is required.'
    }),
  manager: Joi.string().allow("", null),
  parentDepartment: Joi.string().allow("", null),
  description: Joi.string()
    .trim()
    .max(500)
    .allow("", null)
    .pattern(/^[a-zA-Z0-9\s.,!?'\-"():;]+$/)
    .custom((value, helpers) => {
        if (!value) return value;
        if (/\s{3,}/.test(value)) return helpers.error('any.invalidSpaces');
        if (/(.)\1{4,}/.test(value)) return helpers.error('any.invalidSpam');
        if (/[A-Z]{11,}/.test(value)) return helpers.error('any.invalidSpam');
        return value;
    })
    .messages({
        'string.max': 'Description cannot exceed 500 characters.',
        'string.pattern.base': 'Description contains invalid characters.',
        'any.invalidSpaces': 'Please avoid excessive spaces.',
        'any.invalidSpam': 'Please enter a meaningful description.'
    })
});

module.exports = { departmentSchema };
