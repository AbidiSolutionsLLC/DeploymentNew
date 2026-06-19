const Joi = require("joi");

const expenseSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).required().messages({
    'string.empty': 'Title is required.',
    'string.min': 'Title must be at least 2 characters.',
    'string.max': 'Title cannot exceed 150 characters.',
    'any.required': 'Title is required.'
  }),
  amount: Joi.number().min(0.01).required().messages({
    'number.base': 'Amount must be a number.',
    'number.min': 'Amount must be greater than 0.',
    'any.required': 'Amount is required.'
  }),
  category: Joi.string().valid("travel", "food", "supplies", "equipment", "other").required(),
  description: Joi.string().trim().allow("", null),
  status: Joi.string().valid("pending", "approved", "rejected").default("pending"),
  receiptUrl: Joi.string().optional(),
  receiptPublicId: Joi.string().optional(),
  blobName: Joi.string().optional(),
  submittedByName: Joi.string().optional()
});

const rejectExpenseSchema = Joi.object({
  rejectionReason: Joi.string().trim().min(2).max(1000).required().messages({
    'string.empty': 'Rejection reason is required.',
    'any.required': 'Rejection reason is required.'
  })
});

module.exports = { expenseSchema, rejectExpenseSchema };
