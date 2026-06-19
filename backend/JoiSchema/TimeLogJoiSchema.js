const Joi = require("joi");

const createTimeLogSchema = Joi.object({
  job: Joi.string().trim().min(2).max(150).required().messages({
    'string.empty': 'Task/Job name is required.',
    'any.required': 'Task/Job name is required.'
  }),
  date: Joi.date().max('now').required().messages({
    'date.base': 'Please select a valid date.',
    'date.max': 'Date cannot be in the future.',
    'any.required': 'Date is required.'
  }),
  hours: Joi.number().min(0.1).max(24).required().messages({
    'number.base': 'Hours must be a valid number.',
    'number.min': 'Hours must be at least 0.1.',
    'number.max': 'Hours cannot exceed 24.',
    'any.required': 'Hours worked is required.'
  }),
  description: Joi.string().trim().allow("", null),
  employeeId: Joi.string().allow(null, "").optional()
});

const updateTimeLogSchema = Joi.object({
  job: Joi.string().trim().min(2).max(150).optional(),
  date: Joi.date().max('now').optional(),
  hours: Joi.number().min(0.1).max(24).optional(),
  description: Joi.string().trim().allow("", null).optional()
});

module.exports = { createTimeLogSchema, updateTimeLogSchema };
