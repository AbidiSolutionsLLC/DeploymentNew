const Joi = require("joi");

const companySchema = Joi.object({
  companyName: Joi.string().trim().min(1).max(150).required().messages({
    'string.empty': 'Company name is required.',
    'any.required': 'Company name is required.'
  }),
  contactNumber: Joi.string().allow("", null).optional(),
  industry: Joi.string().allow("", null).optional(),
  companyWebsite: Joi.string().uri().allow("", null).optional(),
  establishedYear: Joi.number().integer().min(1800).max(new Date().getFullYear()).allow(null).optional(),
  numberOfEmployees: Joi.string().allow("", null).optional(),
  officeAddress: Joi.string().allow("", null).optional(),
  adminName: Joi.string().allow("", null).optional(),
  adminEmail: Joi.string().email().allow("", null).optional(),
  timeZone: Joi.string().allow("", null).optional(),
  subscriptionPlan: Joi.string().allow("", null).optional()
});

module.exports = { companySchema };
