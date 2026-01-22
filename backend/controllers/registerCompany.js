const Company = require("../models/companySchema");
const catchAsync = require("../utils/catchAsync");
const { NotFoundError } = require("../utils/ExpressError");

// Create Company
exports.createCompany = catchAsync(async (req, res) => {
  const newCompany = new Company(req.body);
  const savedCompany = await newCompany.save();
  res.status(201).json(savedCompany);
});

// Get All Companies
exports.getAllCompanies = catchAsync(async (req, res) => {
  const companies = await Company.find();
  res.status(200).json(companies);
});

// Get Company by ID
exports.getCompanyById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const company = await Company.findById(id);

  if (!company) throw new NotFoundError("Company");

  res.status(200).json(company);
});

// Update Company
exports.updateCompany = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const company = await Company.findById(id);
  if (!company) throw new NotFoundError("Company");

  Object.assign(company, updates);
  const updatedCompany = await company.save();

  res.status(200).json(updatedCompany);
});

// Delete Company
exports.deleteCompany = catchAsync(async (req, res) => {
  const { id } = req.params;

  const company = await Company.findByIdAndDelete(id);
  if (!company) throw new NotFoundError("Company");

  res.status(200).json({ message: "Company deleted successfully" });
});
