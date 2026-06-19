const companyService = require("../services/companyService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.createCompany = catchAsync(async (req, res) => {
  const savedCompany = await companyService.createCompany(req.body);
  res.status(201).json(savedCompany);
});

exports.getAllCompanies = catchAsync(async (req, res) => {
  const companies = await companyService.getAllCompanies();
  res.status(200).json(companies);
});

exports.getCompanyById = catchAsync(async (req, res) => {
  const company = await companyService.getCompanyById(req.params.id);
  res.status(200).json(company);
});

exports.updateCompany = catchAsync(async (req, res) => {
  const updatedCompany = await companyService.updateCompany(req.params.id, req.body);
  res.status(200).json(updatedCompany);
});

exports.deleteCompany = catchAsync(async (req, res) => {
  await companyService.deleteCompany(req.params.id);
  res.status(200).json({ message: "Company deleted successfully" });
});
