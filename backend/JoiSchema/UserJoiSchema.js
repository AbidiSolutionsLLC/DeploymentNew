const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string().trim().min(1).max(101).required().messages({
    'string.min': 'Name must be at least 1 character.',
    'string.max': 'Name cannot exceed 101 characters.',
    'any.required': 'Name is required.'
  }),
  email: Joi.string().email().max(254).required().messages({
    'string.email': 'Please enter a valid email address.',
    'any.required': 'Email is required.'
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).optional(), 
  
  role: Joi.string().valid("SuperAdmin", "Admin", "HR", "Manager", "Employee").default("Employee"),
  empType: Joi.string().valid("Permanent", "Contractor", "Intern", "Part Time").required(),
  endDate: Joi.date().allow(null, ""),
  empStatus: Joi.string().valid("Active", "Inactive"),
  
  empID: Joi.string().allow(null, ""), 
  
  department: Joi.string().allow(null, ""),
  reportsTo: Joi.string().allow(null, ""), 
  designation: Joi.string().required(),
  
  joiningDate: Joi.date().required(),
  timeZone: Joi.string().required(),
  phoneNumber: Joi.string().allow(null, ""),
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
  avatar: Joi.string().allow(""),
  isTechnician: Joi.boolean().default(false),
  hourlyWage: Joi.number().min(0).default(0),
  avalaibleLeaves: Joi.number().min(0).optional()
});

const userUpdateSchema = userSchema.fork(
  ["name", "email", "empType", "designation", "joiningDate", "timeZone", "branch", "salary", "role", "isTechnician", "hourlyWage", "avalaibleLeaves", "empID"],
  (schema) => schema.optional()
);

module.exports = {
  userSchema,
  userUpdateSchema,
};