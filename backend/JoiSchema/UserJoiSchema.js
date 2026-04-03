const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(101)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.min': 'Name must be at least 3 characters.',
      'string.max': 'Name cannot exceed 101 characters.',
      'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes.',
      'any.required': 'Name is required.'
    }),
  email: Joi.string()
    .email()
    .max(254)
    .required()
    .messages({
      'string.email': 'Please enter a valid email address.',
      'string.max': 'Email is too long.',
      'any.required': 'Email is required.'
    }),
  // Password removed as it is handled by Microsoft Auth / not required on creation
  password: Joi.string().min(6).optional(), 
  
  role: Joi.string().valid("SuperAdmin", "Admin", "HR", "Manager", "Employee").default("Employee"),
  empType: Joi.string().valid("Permanent", "Contractor", "Intern", "Part Time").required(),
  endDate: Joi.date().allow(null, ""),
  empStatus: Joi.string().valid("Active", "Inactive"),
  
  // empID removed from validation since backend generates it
  // empID: Joi.string().required(), 
  
  department: Joi.string().allow(null, ""),
  reportsTo: Joi.string().allow(null, ""), 
  designation: Joi.string().required(),
  
  joiningDate: Joi.date().required(),
  timeZone: Joi.string().required(),
  phoneNumber: Joi.string()
    .pattern(/^\+?[0-9]{7,15}$/)
    .allow(null, "")
    .messages({
      'string.pattern.base': 'Please enter a valid phone number (7–15 digits, optional + prefix).'
    }),
  branch: Joi.string().required(),
  salary: Joi.number().allow(null),
  address: Joi.string().allow(""),
  about: Joi.string().allow(""),
  maritalStatus: Joi.string().allow(null, ""),
  DOB: Joi.date().allow(null, ""),
  emergencyContact: Joi.array().items(
    Joi.object({
      name: Joi.string().allow("").optional(),
      relation: Joi.string().allow("").optional(),
      phone: Joi.string().allow("").optional()
    })
  ).optional(),
  
  experience: Joi.array().items(Joi.object().unknown(true)),
  education: Joi.array().items(Joi.object().unknown(true)),
  dashboardCards: Joi.array(),
  
  addedby: Joi.string(),
  avatar: Joi.string().allow("")
});

const userUpdateSchema = userSchema.fork(
  ["name", "email", "empType", "designation", "joiningDate", "timeZone", "branch", "salary", "role"],
  (schema) => schema.optional()
);

module.exports = {
  userSchema,
  userUpdateSchema,
};