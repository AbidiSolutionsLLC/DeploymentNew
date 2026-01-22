const mongoose = require('mongoose');

const aclSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User' },
  email: { type: String }, // For sharing with specific emails
  role: { 
    type: String, 
    enum: ['owner', 'editor', 'viewer'], 
    default: 'viewer' 
  },
  accessType: { 
    type: String, 
    enum: ['user', 'role', 'public'], 
  },
  roleName: { type: String } // For role-based access (e.g., 'manager', 'employee')
}, { _id: false });

module.exports = aclSchema;