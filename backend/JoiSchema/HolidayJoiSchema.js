const Joi = require("joi");

const holidaySchema = Joi.object({
  holidayName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.empty': 'Holiday name is required.',
      'string.min': 'Holiday name must be at least 2 characters.',
      'string.max': 'Holiday name cannot exceed 500 characters.',
      'string.pattern.base': 'Holiday name can only contain letters, spaces, hyphens, and apostrophes.',
      'any.required': 'Holiday name is required.'
    }),
  date: Joi.date()
    .required()
    .messages({
      'date.base': 'Please select a valid date.',
      'any.required': 'Date is required.'
    }),
  holidayType: Joi.string()
    .valid("National", "Regional", "Religious", "Company-Specific")
    .required()
    .messages({
      'any.only': 'Please select a valid holiday type.',
      'any.required': 'Holiday type is required.'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow("", null)
    .pattern(/^[a-zA-Z0-9\s.,!?'\-"():;]+$/)
    .custom((value, helpers) => {
        if (!value) return value;
        if (/\s{3,}/.test(value)) return helpers.error('any.invalidSpaces');
        if (/(.)\1{4,}/.test(value)) return helpers.error('any.invalidSpam');
        if (/[A-Z]{11,}/.test(value)) return helpers.error('any.invalidSpam');
        return value;
    })
    .messages({
        'string.max': 'Description cannot exceed 500 characters.',
        'string.pattern.base': 'Description contains invalid characters.',
        'any.invalidSpaces': 'Please avoid excessive spaces.',
        'any.invalidSpam': 'Please enter a meaningful description.'
    }),
  isRecurring: Joi.boolean().default(false),
  day: Joi.string().required()
});

module.exports = { holidaySchema };
