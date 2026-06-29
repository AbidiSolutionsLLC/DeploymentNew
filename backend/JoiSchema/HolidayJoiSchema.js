const Joi = require("joi");

const holidaySchema = Joi.object({
  holidayName: Joi.string().trim().min(1).max(150).required().messages({
    'string.empty': 'Holiday name is required.',
    'string.min': 'Holiday name must be at least 1 character.',
    'any.required': 'Holiday name is required.'
  }),
  date: Joi.date().required().messages({
    'date.base': 'Please select a valid date.',
    'any.required': 'Date is required.'
  }),
  holidayType: Joi.string().valid("National", "Regional", "Religious", "Company-Specific").required(),
  description: Joi.string().trim().max(1000).allow("", null),
  isRecurring: Joi.boolean().default(false),
  day: Joi.string().required()
});

module.exports = { holidaySchema };
