const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  email: {
    type: String,
    required: true,
  },
  leaveType: {
    type: String,
    enum: ["PTO", "Sick"],
    required: true,
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
    required: true,
  },
  reason: String,
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  appliedAt: {
    type: Date,
    default: () => Date.now(),
  },
});

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
