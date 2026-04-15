const Joi = require('joi');

const leaveSchema = Joi.object({
  leaveType: Joi.string()
    .trim()
    .valid('sick', 'personal', 'paid', 'unpaid', 'Sick', 'PTO') // Allowing existing values while enforcing rules
    .required()
    .messages({
      'any.only': 'Please select a valid leave type.',
      'any.required': 'Leave type is required.'
    }),
  
  startDate: Joi.date()
    .required()
    .messages({
      'date.base': 'Please select a valid start date.',
      'any.required': 'Start date is required.'
    }),
  
  endDate: Joi.date()
    .min(Joi.ref('startDate'))
    .required()
    .messages({
      'date.base': 'Please select a valid end date.',
      'date.min': 'End date must be after start date.',
      'any.required': 'End date is required.'
    }),
  
  reason: Joi.string()
    .trim()
    .min(20)
    .max(500)
    .pattern(/^[a-zA-Z0-9\s.,!?'\-"():;]+$/)
    .custom((value, helpers) => {
      // Span check: No consecutive spaces (max 2 allowed)
      if (/\s{3,}/.test(value)) return helpers.error('any.invalidSpaces');
      
      // Repeated characters spam
      if (/(.)\1{4,}/.test(value)) return helpers.error('any.invalidSpam');
      
      // All-caps spam (more than 10 characters)
      if (/[A-Z]{11,}/.test(value)) return helpers.error('any.invalidSpam');
      
      // Word count check
      const words = value.trim().split(/\s+/).filter(w => w.length > 0);
      if (words.length < 3) return helpers.error('any.notEnoughWords');
      
      return value;
    })
    .messages({
      'string.empty': 'Description is required.',
      'string.min': 'Description must be at least 20 characters.',
      'string.max': 'Description cannot exceed 500 characters.',
      'string.pattern.base': 'Description contains invalid characters.',
      'any.invalidSpaces': 'Please avoid excessive spaces.',
      'any.invalidSpam': 'Please enter a meaningful description.',
      'any.notEnoughWords': 'Description must contain at least 3 words.',
      'any.required': 'Description is required.'
    })
    .required(),
  
  // Optional compatibility fields sent by older apply-leave forms.
  // Controller uses authenticated user and recalculates days server-side.
  userId: Joi.string().optional(),
  days: Joi.number().optional()
});

const leaveResponseSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .pattern(/^[a-zA-Z0-9\s.,!?'\-"():;]+$/)
    .custom((value, helpers) => {
      if (/\s{3,}/.test(value)) return helpers.error('any.invalidSpaces');
      if (/(.)\1{4,}/.test(value)) return helpers.error('any.invalidSpam');
      if (/[A-Z]{11,}/.test(value)) return helpers.error('any.invalidSpam');
      const words = value.trim().split(/\s+/).filter(w => w.length > 0);
      if (words.length < 3) return helpers.error('any.notEnoughWords');
      return value;
    })
    .messages({
      'string.empty': 'Response cannot be empty.',
      'string.min': 'Response must be at least 10 characters.',
      'string.max': 'Response cannot exceed 500 characters.',
      'string.pattern.base': 'Response contains invalid characters.',
      'any.invalidSpaces': 'Please avoid excessive spaces.',
      'any.invalidSpam': 'Please enter a meaningful response.',
      'any.notEnoughWords': 'Response must contain at least 3 words.',
      'any.required': 'Response is required.'
    })
    .required()
});

module.exports = { leaveSchema, leaveResponseSchema };
