const Joi = require("joi");

const timesheetCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required().messages({
    'string.empty': 'Comment cannot be empty.',
    'any.required': 'Comment is required.'
  })
});

const createTimesheetSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required().messages({
    'string.empty': 'Timesheet Name is required.',
    'any.required': 'Timesheet Name is required.'
  }),
  date: Joi.date().required().messages({
    'date.base': 'Please select a valid date.',
    'any.required': 'Date is required.'
  }),
  submittedHours: Joi.number().min(0).max(100).optional(),
  description: Joi.string().trim().allow("", null),
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
  approvedHours: Joi.number().min(0).max(100).optional()
});

module.exports = { 
  timesheetCommentSchema, 
  createTimesheetSchema, 
  updateTimesheetStatusSchema 
};
