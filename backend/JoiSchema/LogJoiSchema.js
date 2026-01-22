const Joi = require('joi');

const logValidationSchema = Joi.object({
  level: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .required()
    .messages({
      'any.only': 'Level must be one of: error, warn, info, debug',
      'any.required': 'Log level is required'
    }),

  message: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Log message cannot be empty',
      'string.min': 'Log message must be at least 3 characters',
      'string.max': 'Log message cannot exceed 200 characters',
      'any.required': 'Log message is required'
    }),

  createdAt: Joi.date()
    .default(Date.now)
    .messages({
      'date.base': 'Invalid date format'
    })
});


module.exports = logValidationSchema;