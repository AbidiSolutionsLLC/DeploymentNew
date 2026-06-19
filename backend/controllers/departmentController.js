const departmentService = require("../services/departmentService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.createDepartment = catchAsync(async (req, res) => {
  const newDept = await departmentService.createDepartment(req.body);
  res.status(201).json(ApiResponse.success(newDept, "Department created successfully"));
});

exports.getAllDepartments = catchAsync(async (req, res) => {
  const departments = await departmentService.getAllDepartments();
  res.status(200).json(ApiResponse.success(departments));
});

exports.getDepartmentById = catchAsync(async (req, res) => {
  const department = await departmentService.getDepartmentById(req.params.id);
  res.status(200).json(ApiResponse.success(department));
});