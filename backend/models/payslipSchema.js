const mongoose = require("mongoose");

const payslipSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  periodStartDate: {
    type: Date,
    required: true,
  },
  periodEndDate: {
    type: Date,
    required: true,
  },
  totalHoursTracked: {
    type: Number,
    required: true,
    default: 0,
  },
  adjustedHours: {
    type: Number,
    default: null, // Null means no adjustment was made
  },
  standardHours: {
    type: Number,
    required: true,
    default: 0,
  },
  extraHours: {
    type: Number,
    default: 0,
  },
  hourlyWage: {
    type: Number,
    required: true,
    default: 0,
  },
  adjustedWage: {
    type: Number,
    default: null, // Null means no adjustment was made
  },
  totalWages: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Draft", "Generated", "Paid"],
    default: "Generated",
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

payslipSchema.index({ employee: 1, periodStartDate: 1, periodEndDate: 1 });
payslipSchema.index({ company: 1 });

module.exports = mongoose.model("Payslip", payslipSchema);
