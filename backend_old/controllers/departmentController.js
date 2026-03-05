const Department = require("../models/departemt");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError } = require("../utils/ExpressError");

// 1. Create a New Department
exports.createDepartment = catchAsync(async (req, res) => {
  const { name, description, manager } = req.body;

  const existing = await Department.findOne({ name });
  if (existing) throw new BadRequestError("Department already exists");

  const newDept = await Department.create({
    name,
    description,
    manager: manager || null
  });

  res.status(201).json(newDept);
});

// 2. Get All Departments (For Dropdowns)
exports.getAllDepartments = catchAsync(async (req, res) => {
  // Populate manager name to show "Engineering (Managed by: Alice)"
  const departments = await Department.find()
    .populate("manager", "name email")
    .select("name manager members"); // Select only what we need

  res.status(200).json(departments);
});

// 3. Get Single Department Details
exports.getDepartmentById = catchAsync(async (req, res) => {
  const department = await Department.findById(req.params.id)
    .populate("manager", "name")
    .populate("members", "name email designation avatar"); // Show all employees

  if (!department) throw new NotFoundError("Department not found");

  res.status(200).json(department);
});