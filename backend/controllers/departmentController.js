const departmentService = require("../services/departmentService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.createDepartment = catchAsync(async (req, res) => {
  const newDept = await departmentService.createDepartment({ ...req.body, company: req.companyId });
  res.status(201).json(ApiResponse.success(newDept, "Department created successfully"));
});

exports.getAllDepartments = catchAsync(async (req, res) => {
  const departments = await departmentService.getAllDepartments(req.companyId);
  res.status(200).json(ApiResponse.success(departments));
});

exports.getDepartmentById = catchAsync(async (req, res) => {
  const department = await departmentService.getDepartmentById(req.params.id);
  res.status(200).json(ApiResponse.success(department));
});

exports.updateDepartment = catchAsync(async (req, res) => {
  const department = await departmentService.updateDepartment(req.params.id, req.body);
  res.status(200).json(ApiResponse.success(department, "Department updated successfully"));
});

exports.deleteDepartment = catchAsync(async (req, res) => {
  await departmentService.deleteDepartment(req.params.id);
  res.status(200).json(ApiResponse.success(null, "Department deleted successfully"));
});