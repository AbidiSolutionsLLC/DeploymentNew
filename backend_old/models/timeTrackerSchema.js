const mongoose = require("mongoose");

const timeTrackerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      const d = new Date();
      d.setUTCHours(0,0,0,0);
      return d;
    }
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day', 'Leave', 'Holiday', 'Weekend'],
    default: 'Absent' 
  },
  notes: {
    type: String
  },
  autoCheckedOut: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("TimeTracker", timeTrackerSchema);