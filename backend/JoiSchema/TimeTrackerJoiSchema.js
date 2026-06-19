const Joi = require("joi");

const timeTrackerSchema = Joi.object({
  userId: Joi.string().optional(),
  timeInfo: Joi.object({
    clockIn: Joi.date().optional().allow(null),
    clockOut: Joi.date().optional().allow(null),
    latitude: Joi.number().optional().allow(null),
    longitude: Joi.number().optional().allow(null),
    ipAddress: Joi.string().optional().allow(null, "")
  }).required(),
  date: Joi.date().optional(),
  isAbsent: Joi.boolean().optional()
});

const editTimeTrackerSchema = Joi.object({
  id: Joi.string().required(),
  data: Joi.object({
    date: Joi.date().optional(),
    status: Joi.string().valid('Present', 'Absent', 'Late', 'Leave', 'Holiday').optional(),
    clockIn: Joi.date().allow(null).optional(),
    clockOut: Joi.date().allow(null).optional(),
    notes: Joi.string().allow("", null).optional(),
    overtime: Joi.number().min(0).optional(),
    lateCount: Joi.number().min(0).optional()
  }).required()
});

module.exports = { timeTrackerSchema, editTimeTrackerSchema };
