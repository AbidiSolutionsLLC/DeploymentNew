const Joi = require("joi");

const timesheetCommentSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .pattern(/^[a-zA-Z0-9\s.,!?'\-"():;]+$/)
    .required()
    .custom((value, helpers) => {
        if (/\s{3,}/.test(value)) return helpers.error('any.invalidSpaces');
        if (/(.)\1{4,}/.test(value)) return helpers.error('any.invalidSpam');
        if (/[A-Z]{11,}/.test(value)) return helpers.error('any.invalidSpam');
        return value;
    })
    .messages({
      'string.empty': 'Comment cannot be empty.',
      'string.min': 'Comment must be at least 5 characters.',
      'string.max': 'Comment cannot exceed 200 characters.',
      'string.pattern.base': 'Comment contains invalid characters.',
      'any.invalidSpaces': 'Please avoid excessive spaces.',
      'any.invalidSpam': 'Please enter a meaningful comment.',
      'any.required': 'Comment is required.'
    })
});

const createTimesheetSchema = Joi.object({
  name: Joi.string().trim().min(3).max(150).required().messages({
    'string.empty': 'Timesheet name is required.',
    'string.min': 'Timesheet name must be at least 3 characters.',
    'any.required': 'Timesheet name is required.'
  }),
  date: Joi.date().required().messages({
    'date.base': 'Please select a valid date.',
    'any.required': 'Date is required.'
  }),
  submittedHours: Joi.number().min(0).max(24).optional(),
  description: Joi.string()
    .trim()
    .min(10)
    .max(500)
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
      'string.max': 'Description cannot exceed 500 characters.',
      'string.pattern.base': 'Description contains invalid characters (@ # $ % ^ are not allowed).',
      'any.invalidSpaces': 'Please avoid excessive spaces in the description.',
      'any.invalidSpam': 'Please enter a meaningful description.',
      'any.notEnoughWords': 'Description must contain at least 3 words.',
      'any.required': 'Description is required.'
    }),
  employee: Joi.string().optional(),
  employeeName: Joi.string().optional(),
  timeLogs: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  attachments: Joi.array().optional(),
    employeeId: Joi.string().allow(null, "").optional()
  
});

const updateTimesheetStatusSchema = Joi.object({
  status: Joi.string().valid("Pending", "Approved", "Rejected").required(),
  approvedHours: Joi.number().min(0).max(24).optional()
});

module.exports = { 
  timesheetCommentSchema, 
  createTimesheetSchema, 
  updateTimesheetStatusSchema 
};
