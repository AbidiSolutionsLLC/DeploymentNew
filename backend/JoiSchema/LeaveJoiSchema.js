const Joi = require('joi');

const leaveSchema = Joi.object({
  leaveType: Joi.string().trim().valid('sick', 'personal', 'paid', 'unpaid', 'Sick', 'PTO').required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  reason: Joi.string().trim().min(2).max(1000).required().messages({
    'string.empty': 'Reason is required.',
    'any.required': 'Reason is required.'
  }),
  userId: Joi.string().optional(),
  days: Joi.number().optional()
});

const leaveResponseSchema = Joi.object({
  content: Joi.string().trim().min(2).max(1000).required().messages({
    'string.empty': 'Response cannot be empty.',
    'any.required': 'Response is required.'
  })
});

module.exports = { leaveSchema, leaveResponseSchema };
