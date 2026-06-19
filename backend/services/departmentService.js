const Department = require("../models/department");
const { BadRequestError, NotFoundError } = require("../utils/ExpressError");

class DepartmentService {
  async createDepartment(data) {
    const { name, description, manager } = data;
    const existing = await Department.findOne({ name });
    if (existing) throw new BadRequestError("Department already exists");

    return Department.create({
      name,
      description,
      manager: manager || null
    });
  }

  async getAllDepartments() {
    return Department.find()
      .populate("manager", "name email")
      .select("name manager members");
  }

  async getDepartmentById(id) {
    const department = await Department.findById(id)
      .populate("manager", "name")
      .populate("members", "name email designation avatar");

    if (!department) throw new NotFoundError("Department not found");
    return department;
  }
}

module.exports = new DepartmentService();
