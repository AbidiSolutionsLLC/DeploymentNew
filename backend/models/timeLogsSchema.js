const mongoose = require("mongoose");

const timeLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    job: {
      type: String,
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
      validate: {
        validator: function (v) {
          return v <= 24 && v >= 0;
        },
        message: "Hours must be between 0 and 24",
      },
    },
    attachments: [
      {
        public_id: String,
        url: String,
        originalname: String,
        format: String,
        size: Number,
        blobName: String
      },
    ],
    isAddedToTimesheet: {
      type: Boolean,
      default: false,
    },
    timesheet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timesheet",
    },
  },
  {
    timestamps: true,
  },
);

timeLogSchema.index({ employee: 1, date: 1 });

const TimeLog =
  mongoose.models.TimeLog || mongoose.model("TimeLog", timeLogSchema);
module.exports = TimeLog;
