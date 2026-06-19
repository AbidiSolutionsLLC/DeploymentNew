const Joi = require('joi');

const logValidationSchema = Joi.object({
  level: Joi.string().valid('error', 'warn', 'info', 'debug').required(),
  message: Joi.string().min(1).max(2000).required().messages({
    'string.empty': 'Log message cannot be empty',
    'any.required': 'Log message is required'
  }),
  createdAt: Joi.date().default(Date.now)
});

module.exports = logValidationSchema;