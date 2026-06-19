const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  emailAddress: {
    type: String,
    required: true
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false 
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  attachments: [{
    name: String,
    url: String,
    blobName: String
  }],
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  ticketID: {
    type: String,
    unique: true,
    required: true
  },
  responses: [
    {
      author: String,
      content: String,
      time: String,
      avatar: String
    }
  ],
  status: {
    type: String,
    enum: ['opened', 'in progress', 'closed' , "Open" , "In Progress", "Closed"],
    default: 'Open'
  }, 
  priority: {
    type: String,
    enum: ["High Priority", "Medium Priority", "Low Priority", "High", "Medium", "Low"],
    default: 'Medium'
  }
}, { timestamps: true });

ticketSchema.index({ company: 1, assignedTo: 1, status: 1 });
ticketSchema.index({ company: 1, user: 1, status: 1 });

module.exports = mongoose.model("Ticket", ticketSchema);
