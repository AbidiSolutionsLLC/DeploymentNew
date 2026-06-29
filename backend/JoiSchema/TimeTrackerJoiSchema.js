const Joi = require("joi");

const timeTrackerSchema = Joi.object({
  user: Joi.string().optional(),
  date: Joi.date().optional(),
  checkInTime: Joi.date().allow(null, "").optional(),
  checkOutTime: Joi.date().allow(null, "").optional(),
  status: Joi.string().valid('Present', 'Absent', 'Half Day', 'Late', 'Leave', 'Holiday', 'On Leave').optional(),
  totalHours: Joi.number().min(0).optional(),
  notes: Joi.string().allow("", null).optional()
});

const editTimeTrackerSchema = Joi.object({
  date: Joi.date().optional(),
  checkInTime: Joi.date().allow(null, "").optional(),
  checkOutTime: Joi.date().allow(null, "").optional(),
  status: Joi.string().valid('Present', 'Absent', 'Half Day', 'Late', 'Leave', 'Holiday', 'On Leave').optional(),
  totalHours: Joi.number().min(0).optional(),
  notes: Joi.string().allow("", null).optional()
});

module.exports = { timeTrackerSchema, editTimeTrackerSchema };
