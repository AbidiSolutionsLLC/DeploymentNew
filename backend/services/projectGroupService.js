const ProjectGroup = require('../models/projectGroupSchema');
const Project = require('../models/projectSchema');
const projectService = require('./projectService');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/ExpressError');

class ProjectGroupService {
  async validateProjects(companyId, projects) {
    if (!projects || !projects.length) return;
    const count = await Project.countDocuments({ _id: { $in: projects }, company: companyId });
    if (count !== new Set(projects.map(String)).size) {
      throw new BadRequestError("All grouped projects must belong to the group company");
    }
  }

  enrichGroupWithMetrics(groupDoc, progressMap) {
    const group = groupDoc.toObject ? groupDoc.toObject() : { ...groupDoc };
    const rawProjects = group.projects || [];

    let totalProgress = 0;
    const enrichedProjects = rawProjects.map((p) => {
      const proj = p.toObject ? p.toObject() : { ...p };
      const pid = proj._id ? proj._id.toString() : proj.toString();
      const pProgress = progressMap.get(pid);
      if (pProgress !== undefined) {
        proj.progress = pProgress;
      } else if (proj.status === 'Completed') {
        proj.progress = 100;
      } else {
        proj.progress = 0;
      }
      totalProgress += proj.progress;
      return proj;
    });

    const projectCount = enrichedProjects.length;
    const activeProjectsCount = enrichedProjects.filter(p =>
      ['Active', 'Planning', 'In Progress', 'Open'].includes(p.status)
    ).length;
    const completedProjectsCount = enrichedProjects.filter(p => p.status === 'Completed').length;
    const avgProgress = projectCount > 0 ? Math.round(totalProgress / projectCount) : 0;

    return {
      ...group,
      projects: enrichedProjects,
      projectCount,
      activeProjectsCount,
      completedProjectsCount,
      progress: avgProgress,
    };
  }

  async createGroup(user, companyId, data) {
    const role = (user.role || '').replace(/\s+/g, '').toLowerCase();
    if (role !== 'admin' && role !== 'superadmin') {
      throw new ForbiddenError('Only Super Admins and Admins can create project groups');
    }
    const owner = user.id || user._id;
    await this.validateProjects(companyId, data.projects);
    const { name, description, projects } = data;
    const group = new ProjectGroup({
      name,
      description,
      projects: projects || [],
      owner,
      company: companyId
    });
    const savedGroup = await group.save();

    if (projects && projects.length) {
      await Project.updateMany(
        { _id: { $in: projects }, company: companyId },
        { $set: { projectGroup: savedGroup._id } }
      );
    }

    return savedGroup;
  }

  async getAllGroups(user, companyId) {
    const groups = await ProjectGroup.find({ company: companyId })
      .populate('owner', 'name email avatar')
      .populate({
        path: 'projects',
        select: 'title description status dueDate owner team startDate',
        populate: [
          { path: 'owner', select: 'name email avatar' },
          { path: 'team', select: 'name email avatar' }
        ]
      })
      .sort({ createdAt: -1 });

    const allProjectIds = groups.flatMap(g =>
      (g.projects || []).map(p => (p._id ? p._id : p))
    );
    const progressMap = await projectService.getProjectProgressMap(allProjectIds, companyId);

    return groups.map(g => this.enrichGroupWithMetrics(g, progressMap));
  }

  async getGroupById(user, companyId, groupId) {
    const group = await ProjectGroup.findOne({ _id: groupId, company: companyId })
      .populate('owner', 'name email avatar')
      .populate({
        path: 'projects',
        select: 'title description status dueDate owner team startDate',
        populate: [
          { path: 'owner', select: 'name email avatar' },
          { path: 'team', select: 'name email avatar' }
        ]
      });
    if (!group) throw new NotFoundError('ProjectGroup');

    const projectIds = (group.projects || []).map(p => (p._id ? p._id : p));
    const progressMap = await projectService.getProjectProgressMap(projectIds, companyId);

    return this.enrichGroupWithMetrics(group, progressMap);
  }

  async updateGroup(user, companyId, groupId, data) {
    const group = await ProjectGroup.findOne({ _id: groupId, company: companyId });
    if (!group) throw new NotFoundError('ProjectGroup');
    
    const role = (user.role || '').replace(/\s+/g, '').toLowerCase();
    const isOwner = group.owner?.toString() === (user.id || user._id)?.toString();
    if (role !== 'admin' && role !== 'superadmin' && !isOwner) {
      throw new ForbiddenError('Not authorized to update this group');
    }

    const { name, description, projects } = data;
    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;

    if (projects !== undefined) {
      await this.validateProjects(companyId, projects);
      const previousProjects = (group.projects || []).map(p => (p._id || p).toString());
      const newProjects = (projects || []).map(p => (p._id || p).toString());

      const added = newProjects.filter(id => !previousProjects.includes(id));
      const removed = previousProjects.filter(id => !newProjects.includes(id));

      if (added.length) {
        await Project.updateMany(
          { _id: { $in: added }, company: companyId },
          { $set: { projectGroup: group._id } }
        );
      }
      if (removed.length) {
        await Project.updateMany(
          { _id: { $in: removed }, company: companyId },
          { $set: { projectGroup: null } }
        );
      }
      group.projects = projects;
    }

    return await group.save();
  }

  async deleteGroup(user, companyId, groupId) {
    const group = await ProjectGroup.findOne({ _id: groupId, company: companyId });
    if (!group) throw new NotFoundError('ProjectGroup');
    
    const role = (user.role || '').replace(/\s+/g, '').toLowerCase();
    if (role !== 'admin' && role !== 'superadmin') {
      throw new ForbiddenError('Not authorized to delete this group');
    }

    await Project.updateMany(
      { projectGroup: group._id, company: companyId },
      { $set: { projectGroup: null } }
    );

    await group.deleteOne();
  }
}

module.exports = new ProjectGroupService();
