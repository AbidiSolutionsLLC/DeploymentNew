const Joi = require("joi");

const createTicketSchema = Joi.object({
  subject: Joi.string()
    .trim()
    .min(5)
    .max(100)
    .required()
    .custom((value, helpers) => {
      // Check for emojis first (before other validations)
      const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F1FF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]/u;
      if (emojiRegex.test(value)) {
        return helpers.error('string.emoji');
      }

      // Check for numbers-only input
      if (/^\d+$/.test(value)) {
        return helpers.error('string.numbersOnly');
      }

      return value;
    })
    .pattern(/^[a-zA-Z0-9\s.,!?'\-"():;]+$/)
    .messages({
      'string.empty': 'Subject is required.',
      'string.min': 'Subject must be at least 5 characters.',
      'string.max': 'Subject cannot exceed 100 characters.',
      'string.pattern.base': 'Subject contains invalid characters.',
      'string.emoji': 'Emojis are not allowed.',
      'string.numbersOnly': 'Numbers are not allowed.',
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
    }),
  avatar: Joi.string().allow(null, "").optional()
});

module.exports = { createTicketSchema, ticketResponseSchema };
