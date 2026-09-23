const mongoose = require('mongoose');

const projectGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
}, { timestamps: true });

module.exports = mongoose.model('ProjectGroup', projectGroupSchema);
