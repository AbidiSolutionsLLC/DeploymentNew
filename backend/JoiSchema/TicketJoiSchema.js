const Joi = require("joi");

const createTicketSchema = Joi.object({
  subject: Joi.string()
    .trim()
    .min(5)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s.,!?'\-"():;]+$/)
    .required()
    .messages({
      'string.empty': 'Subject is required.',
      'string.min': 'Subject must be at least 5 characters.',
      'string.max': 'Subject cannot exceed 100 characters.',
      'string.pattern.base': 'Subject contains invalid characters.',
      'any.required': 'Subject is required.'
    }),
  description: Joi.string()
    .trim()
    .min(10)
    .max(1000)
    .pattern(/^[a-zA-Z0-9\s.,!?'\-"():;]+$/)
    .required()
    .custom((value, helpers) => {
        if (/\s{3,}/.test(value)) return helpers.error('any.invalidSpaces');
        if (/(.)\1{4,}/.test(value)) return helpers.error('any.invalidSpam');
        if (/[A-Z]{11,}/.test(value)) return helpers.error('any.invalidSpam');
        return value;
    })
    .messages({
      'string.empty': 'Description is required.',
      'string.min': 'Description must be at least 10 characters.',
      'string.max': 'Description cannot exceed 1000 characters.',
      'string.pattern.base': 'Description contains invalid characters.',
      'any.invalidSpaces': 'Please avoid excessive spaces.',
      'any.invalidSpam': 'Please enter a meaningful description.',
      'any.required': 'Description is required.'
    }),
  emailAddress: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please enter a valid email address.',
      'any.required': 'Email is required.'
    }),
  priority: Joi.string()
    .valid("High", "Medium", "Low", "High Priority", "Medium Priority", "Low Priority")
    .optional(),
  assignedTo: Joi.string().allow(null, "").optional(),
  attachments: Joi.array().optional()
});

const ticketResponseSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .pattern(/^[a-zA-Z0-9\s.,!?'\-"():;]+$/)
    .required()
    .custom((value, helpers) => {
        if (/\s{3,}/.test(value)) return helpers.error('any.invalidSpaces');
        if (/(.)\1{4,}/.test(value)) return helpers.error('any.invalidSpam');
        if (/[A-Z]{11,}/.test(value)) return helpers.error('any.invalidSpam');
        return value;
    })
    .messages({
      'string.empty': 'Response cannot be empty.',
      'string.min': 'Response must be at least 5 characters.',
      'string.max': 'Response cannot exceed 500 characters.',
      'string.pattern.base': 'Response contains invalid characters.',
      'any.invalidSpaces': 'Please avoid excessive spaces.',
      'any.invalidSpam': 'Please enter a meaningful response.',
      'any.required': 'Response is required.'
    })
});

module.exports = { createTicketSchema, ticketResponseSchema };
