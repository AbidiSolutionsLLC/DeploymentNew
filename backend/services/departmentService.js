const Department = require("../models/department");
const { BadRequestError, NotFoundError } = require("../utils/ExpressError");

class DepartmentService {
  async createDepartment(data) {
    const { name, description, manager, company } = data;
    const filter = company ? { name, company } : { name };
    const existing = await Department.findOne(filter);
    if (existing) throw new BadRequestError("Department already exists");

    return Department.create({
      name,
      description,
      manager: manager || null,
      company: company || null,
    });
  }

  async getAllDepartments(companyId) {
    const filter = companyId
      ? { $or: [{ company: companyId }, { company: null }, { company: { $exists: false } }] }
      : {};
    return Department.find(filter)
      .populate("manager", "name email")
      .select("name manager members company");
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
