const ProjectGroup = require('../models/projectGroupSchema');
const { NotFoundError, ForbiddenError } = require('../utils/ExpressError');

class ProjectGroupService {
  async createGroup(user, companyId, data) {
    const owner = user.id || user._id;
    const group = new ProjectGroup({
      ...data,
      owner,
      company: companyId
    });
    return await group.save();
  }

  async getAllGroups(user, companyId) {
    return await ProjectGroup.find({ company: companyId })
      .populate('owner', 'name email avatar')
      .populate('projects', 'title status dueDate')
      .sort({ createdAt: -1 });
  }

  async updateGroup(user, companyId, groupId, data) {
    const group = await ProjectGroup.findOne({ _id: groupId, company: companyId });
    if (!group) throw new NotFoundError('ProjectGroup');
    
    // Add simple ownership check
    if (group.owner.toString() !== (user.id || user._id).toString() && user.role !== 'admin' && user.role !== 'superadmin') {
      throw new ForbiddenError('Not authorized to update this group');
    }

    Object.assign(group, data);
    return await group.save();
  }

  async deleteGroup(user, companyId, groupId) {
    const group = await ProjectGroup.findOne({ _id: groupId, company: companyId });
    if (!group) throw new NotFoundError('ProjectGroup');
    
    if (group.owner.toString() !== (user.id || user._id).toString() && user.role !== 'admin' && user.role !== 'superadmin') {
      throw new ForbiddenError('Not authorized to delete this group');
    }

    await group.deleteOne();
  }
}

module.exports = new ProjectGroupService();
