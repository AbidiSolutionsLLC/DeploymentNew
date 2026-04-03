const Joi = require("joi");

const createTimeLogSchema = Joi.object({
  job: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-'.,&]+$/)
    .required()
    .messages({
      'string.empty': 'Task/Job name is required.',
      'string.min': 'Task/Job name must be at least 3 characters.',
      'string.max': 'Task/Job name cannot exceed 100 characters.',
      'string.pattern.base': 'Task/Job name contains invalid characters.',
      'any.required': 'Task/Job name is required.'
    }),
  date: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.base': 'Please select a valid date.',
      'date.max': 'Date cannot be in the future.',
      'any.required': 'Date is required.'
    }),
  hours: Joi.number()
    .min(0.5)
    .max(24)
    .required()
    .messages({
      'number.base': 'Hours must be a valid number.',
      'number.min': 'Hours must be at least 0.5.',
      'number.max': 'Hours cannot exceed 24.',
      'any.required': 'Hours worked is required.'
    }),
  description: Joi.string()
    .trim()
    .min(10)
    .max(300)
    .pattern(/^[a-zA-Z0-9\s.,!?'\-"():;]+$/)
    .required()
    .custom((value, helpers) => {
      if (/\s{3,}/.test(value)) return helpers.error('any.invalidSpaces');
      if (/(.)\1{4,}/.test(value)) return helpers.error('any.invalidSpam');
      if (/[A-Z]{11,}/.test(value)) return helpers.error('any.invalidSpam');
      const words = value.trim().split(/\s+/).filter(w => w.length > 0);
      if (words.length < 3) return helpers.error('any.notEnoughWords');
      return value;
    })
    .messages({
      'string.empty': 'Description is required.',
      'string.min': 'Description must be at least 10 characters. Please provide a meaningful description.',
      'string.max': 'Description cannot exceed 300 characters.',
      'string.pattern.base': 'Description contains invalid characters (@ # $ % ^ are not allowed).',
      'any.invalidSpaces': 'Please avoid excessive spaces in the description.',
      'any.invalidSpam': 'Please enter a meaningful description.',
      'any.notEnoughWords': 'Description must contain at least 3 words.',
      'any.required': 'Description is required.'
    }),
  employeeId: Joi.string().allow(null, "").optional()
});

const updateTimeLogSchema = Joi.object({
  job: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-'.,&]+$/)
    .optional()
    .messages({
      'string.min': 'Task/Job name must be at least 3 characters.',
      'string.max': 'Task/Job name cannot exceed 100 characters.',
      'string.pattern.base': 'Task/Job name contains invalid characters.'
    }),
  date: Joi.date().max('now').optional().messages({
    'date.max': 'Date cannot be in the future.'
  }),
  hours: Joi.number().min(0.5).max(24).optional().messages({
    'number.min': 'Hours must be at least 0.5.',
    'number.max': 'Hours cannot exceed 24.'
  }),
  description: Joi.string()
    .trim()
    .min(10)
    .max(300)
    .pattern(/^[a-zA-Z0-9\s.,!?'\-"():;]+$/)
    .optional()
    .custom((value, helpers) => {
      if (!value) return value;
      if (/\s{3,}/.test(value)) return helpers.error('any.invalidSpaces');
      if (/(.)\1{4,}/.test(value)) return helpers.error('any.invalidSpam');
      if (/[A-Z]{11,}/.test(value)) return helpers.error('any.invalidSpam');
      const words = value.trim().split(/\s+/).filter(w => w.length > 0);
      if (words.length < 3) return helpers.error('any.notEnoughWords');
      return value;
    })
    .messages({
      'string.min': 'Description must be at least 10 characters.',
      'string.max': 'Description cannot exceed 300 characters.',
      'string.pattern.base': 'Description contains invalid characters.',
      'any.invalidSpaces': 'Please avoid excessive spaces.',
      'any.invalidSpam': 'Please enter a meaningful description.',
      'any.notEnoughWords': 'Description must contain at least 3 words.'
    })
});

module.exports = { createTimeLogSchema, updateTimeLogSchema };
