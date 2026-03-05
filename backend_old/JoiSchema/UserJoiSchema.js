const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  // Password removed as it is handled by Microsoft Auth / not required on creation
  password: Joi.string().min(6).optional(), 
  
  role: Joi.string().valid("SuperAdmin", "Admin", "HR", "Manager", "Employee").default("Employee"),
  empType: Joi.string().valid("Permanent", "Contractor", "Intern", "Part Time").required(),
  empStatus: Joi.string().valid("Active", "Inactive"),
  
  // empID removed from validation since backend generates it
  // empID: Joi.string().required(), 
  
  department: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Department must be a valid ID"
  }),
  reportsTo: Joi.string().regex(/^[0-9a-fA-F]{24}$/).allow(null, ""), 
  designation: Joi.string().required(),
  
  joiningDate: Joi.date().required(),
  timeZone: Joi.string().required(),
  phoneNumber: Joi.number().required(),
  branch: Joi.string().required(),
  salary: Joi.number().allow(null),
  address: Joi.string().allow(""),
  about: Joi.string().allow(""),
  
  experience: Joi.array().items(Joi.object().unknown(true)),
  education: Joi.array().items(Joi.object().unknown(true)),
  dashboardCards: Joi.array(),
  
  addedby: Joi.string(),
  avatar: Joi.string().allow("")
});

const userUpdateSchema = userSchema.fork(
  ["email", "password", "role", "empType", "joiningDate", "phoneNumber"],
  (schema) => schema.optional()
);

module.exports = {
  userSchema,
  userUpdateSchema,
};