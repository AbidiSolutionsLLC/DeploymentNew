const Joi = require("joi");

const createTicketSchema = Joi.object({
  subject: Joi.string().trim().min(1).max(150).required().messages({
    'string.empty': 'Subject is required.',
    'any.required': 'Subject is required.'
  }),
  description: Joi.string().trim().min(1).max(5000).required().messages({
    'string.empty': 'Description is required.',
    'any.required': 'Description is required.'
  }),
  emailAddress: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address.',
    'any.required': 'Email is required.'
  }),
  priority: Joi.string().valid("High", "Medium", "Low", "High Priority", "Medium Priority", "Low Priority").optional(),
  assignedTo: Joi.string().allow(null, "").optional(),
  attachments: Joi.array().optional()
});

const ticketResponseSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required().messages({
    'string.empty': 'Response cannot be empty.',
    'any.required': 'Response is required.'
  }),
  avatar: Joi.string().allow(null, "").optional()
});

module.exports = { createTicketSchema, ticketResponseSchema };
