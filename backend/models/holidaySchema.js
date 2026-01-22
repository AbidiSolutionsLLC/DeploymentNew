const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    day: {
      type: String,
      required: true,
    },
    holidayName: {
      type: String,
      required: true,
    },
    holidayType: {
      type: String,
      enum: ["National", "Regional", "Religious", "Company-Specific"],
      required: true,
    },
    description: {
      type: String,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Holiday = mongoose.models.Holiday || mongoose.model("Holiday", holidaySchema);
module.exports = Holiday;