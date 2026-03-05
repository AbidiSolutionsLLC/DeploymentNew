const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  emailAddress: {
    type: String,
    required: true
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
    required: true
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
    // enum: ['opened', 'in progress', 'closed' , "Open" , "In Progress", "Closed"],
    default: 'Open'
  }, 
  priority: {
    type: String,
    // enum: ["High Priority", "Medium Priority", "Low Priority"],
    default: 'Medium'
  }
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
