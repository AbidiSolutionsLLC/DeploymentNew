const mongoose = require('mongoose');
const aclSchema = require('../models/aclSchema');


const folderSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  parentId:  { type: mongoose.Types.ObjectId, ref: 'Folder', default: null },
  ownerId:   { type: mongoose.Types.ObjectId, ref: 'User' , default: null},
  acl:       [aclSchema],
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Folder', folderSchema);

