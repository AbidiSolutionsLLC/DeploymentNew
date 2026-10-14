const Department = require("../models/department");
const User = require("../models/userSchema");
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
      .select("name description manager members company createdAt");
  }

  async getDepartmentById(id) {
    const department = await Department.findById(id)
      .populate("manager", "name")
      .populate("members", "name email designation avatar");

    if (!department) throw new NotFoundError("Department not found");
    return department;
  }

  async updateDepartment(id, data) {
    const { name, description, manager, parentDepartment } = data;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (manager !== undefined) updateData.manager = manager || null;
    if (parentDepartment !== undefined) updateData.parentDepartment = parentDepartment || null;

    const existing = await Department.findOne({ name: updateData.name, _id: { $ne: id } });
    if (existing) throw new BadRequestError("Department with this name already exists");

    const department = await Department.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate("manager", "name email")
      .populate("members", "name email designation avatar");

    if (!department) throw new NotFoundError("Department not found");
    return department;
  }

  async deleteDepartment(id) {
    const department = await Department.findById(id);
    if (!department) throw new NotFoundError("Department not found");

    await User.updateMany({ department: id }, { $unset: { department: 1 } });
    await Department.deleteMany({ parentDepartment: id });

    await Department.findByIdAndDelete(id);
    return { success: true, message: "Department deleted successfully" };
  }
}

module.exports = new DepartmentService();
