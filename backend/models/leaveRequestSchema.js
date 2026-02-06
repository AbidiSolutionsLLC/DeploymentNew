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
    responses: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    time: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      required: false
    },
    isSystemNote: {
      type: Boolean,
      default: false
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    attachments: [{
      name: String,
      url: String,
      blobName: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
 
  appliedAt: {
    type: Date,
    default: () => Date.now(),
  },
});
 
module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
