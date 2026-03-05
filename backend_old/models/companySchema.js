const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    unique: true,
  },
  companyOwner: {
    type: String,
    required: true
  },
  contactNo: {
    type: String,
    required: true
  },
  companyEmail: {
    type: String,
    required: true,
    unique: true
  },
  website: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    required: true,
  },
  noOfEmployees: {
    type: Number,
    required: true,
  },
  noOfApps: {
    type: Number,
    default: 0
  },
  aboutCompany: {
    type: String
  },
  companyLogo: {
    type: String 
  },
  companyType: {
    type: String,
    enum: ['Tech', 'Marketing', 'E-Commerce', 'Other'],
    required: true
  },
  branches: {
    type: String,
  },
  departments: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Company", companySchema);

