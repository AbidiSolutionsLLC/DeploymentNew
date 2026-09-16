// models/logModel.js

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  level: { type: String, required: true },
  message: { type: String, required: true },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: false,
  },
  createdAt: { type: Date, default: Date.now },
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
