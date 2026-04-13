const Joi = require("joi");

const expenseSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(5)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s'-]+$/)
    .required()
    .messages({
      'string.empty': 'Title is required.',
      'string.min': 'Title must be at least 5 characters.',
      'string.max': 'Title cannot exceed 100 characters.',
      'string.pattern.base': 'Title can only contain letters, numbers, spaces, hyphens, and apostrophes.',
      'any.required': 'Title is required.'
    }),
  amount: Joi.number()
    .min(0.01)
    .required()
    .messages({
      'number.base': 'Amount must be a number.',
      'number.min': 'Amount must be greater than 0.',
      'any.required': 'Amount is required.'
    }),
  category: Joi.string()
    .valid("travel", "food", "supplies", "equipment", "other")
    .required()
    .messages({
      'any.only': 'Please select a valid category.',
      'any.required': 'Category is required.'
    }),
  description: Joi.string()
    .trim()
    .allow("", null)
    .custom((value, helpers) => {
        if (!value) return value;
        if (/\s{3,}/.test(value)) return helpers.error('any.invalidSpaces');
        if (/(.)\1{4,}/.test(value)) return helpers.error('any.invalidSpam');
        if (/[A-Z]{11,}/.test(value)) return helpers.error('any.invalidSpam');
        return value;
    })
    .messages({
        'any.invalidSpaces': 'Please avoid excessive spaces.',
        'any.invalidSpam': 'Please enter a meaningful description.'
    }),
  status: Joi.string().valid("pending", "approved", "rejected").default("pending"),
  receiptUrl: Joi.string().optional(),
  receiptPublicId: Joi.string().optional(),
  blobName: Joi.string().optional(),
  submittedByName: Joi.string().optional()
});

const rejectExpenseSchema = Joi.object({
  rejectionReason: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Rejection reason is required.',
      'string.min': 'Rejection reason must be at least 10 characters.',
      'string.max': 'Rejection reason cannot exceed 500 characters.',
      'any.required': 'Rejection reason is required.'
    })
});

module.exports = { expenseSchema, rejectExpenseSchema };
