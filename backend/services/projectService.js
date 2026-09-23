const Project = require("../models/projectSchema");
const Task = require("../models/taskSchema");
const { NotFoundError, BadRequestError } = require("../utils/ExpressError");
const { createNotification } = require('../utils/notificationService');

class ProjectService {
  async createProject(user, companyId, data) {
    const { title, description, team, strict, isPublic, startDate, dueDate } = data;
    const owner = user.id || user._id;

    const project = new Project({
      title,
      description,
      team,
      owner,
      strict,
      isPublic,
      startDate,
      dueDate,
      company: companyId,
    });

    const savedProject = await project.save();

    if (savedProject.team && savedProject.team.length > 0) {
      savedProject.team.forEach(memberId => {
        createNotification({
          recipient: memberId,
          type: 'PROJECT_CREATED',
          title: 'New Project Assignment',
          message: `A new project "${savedProject.title}" has been created and you are assigned to it.`,
          relatedEntity: { entityType: 'project', entityId: savedProject._id },
        }).catch(err => console.error('Notification failed:', err));
      });
    }

    return savedProject;
  }

  async getAllProjects(user, companyId, query) {
    const { page = 1, limit = 20, search = '', status, myProjects } = query;
    const skip = (page - 1) * limit;

    const userId = user.id || user._id;

    const filter = {
      company: companyId,
      ...(status && { status }),
      ...(search && {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }),
      ...(myProjects === 'true' && {
        $or: [{ owner: userId }, { team: userId }],
      })
    };

    const [data, total] = await Promise.all([
      Project.find(filter)
        .populate("team", "name email avatar")
        .populate("owner", "name email avatar")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Project.countDocuments(filter)
    ]);

    return {
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getProjectById(user, companyId, projectId) {
    const project = await Project.findOne({ _id: projectId, company: companyId })
      .populate("team", "name email avatar")
      .populate("owner", "name email avatar");

    if (!project) throw new NotFoundError("Project");

    const userRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = userRole === 'admin';
    const isManagerTech = userRole === 'manager' && user.isTechnician;
    const isOwner = project.owner && project.owner._id ? project.owner._id.toString() === (user.id || user._id).toString() : project.owner?.toString() === (user.id || user._id).toString();
    const isTeamMember = project.team.some(member => {
        return member && member._id ? member._id.toString() === (user.id || user._id).toString() : member.toString() === (user.id || user._id).toString();
    });
    
    if (!isSuperAdmin && !isAdmin && !isManagerTech && !isOwner && !isTeamMember) {
      throw new ForbiddenError("You do not have permission to access or modify this project.");
    }

    return project;
  }

  async updateProject(user, companyId, projectId, data) {
    const { title, description, team, status, strict, isPublic, startDate, dueDate } = data;

    const project = await Project.findOne({ _id: projectId, company: companyId });
    if (!project) throw new NotFoundError("Project");

    const userRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = userRole === 'admin';
    const isManagerTech = userRole === 'manager' && user.isTechnician;
    const isOwner = project.owner && project.owner._id ? project.owner._id.toString() === (user.id || user._id).toString() : project.owner?.toString() === (user.id || user._id).toString();
    const isTeamMember = project.team.some(member => {
        return member && member._id ? member._id.toString() === (user.id || user._id).toString() : member.toString() === (user.id || user._id).toString();
    });
    
    if (!isSuperAdmin && !isAdmin && !isManagerTech && !isOwner && !isTeamMember) {
      throw new ForbiddenError("You do not have permission to access or modify this project.");
    }

    const previousTeam = project.team.map(id => id.toString());

    project.title = title || project.title;
    project.description = description || project.description;
    project.team = team || project.team;
    project.status = status || project.status;
    project.strict = strict !== undefined ? strict : project.strict;
    project.isPublic = isPublic !== undefined ? isPublic : project.isPublic;
    project.startDate = startDate || project.startDate;
    project.dueDate = dueDate || project.dueDate;

    const updatedProject = await project.save();

    if (team && team.length > 0) {
      const newMembers = team.filter(id => !previousTeam.includes(id.toString()));
      newMembers.forEach(memberId => {
        createNotification({
          recipient: memberId,
          type: 'PROJECT_MEMBER_ADDED',
          title: 'Added to Project',
          message: `You have been added to the project "${updatedProject.title}".`,
          relatedEntity: { entityType: 'project', entityId: updatedProject._id },
        }).catch(err => console.error('Notification failed:', err));
      });
    }

    if (status && status !== project.status) {
      const recipients = [...new Set([...updatedProject.team.map(id => id.toString()), updatedProject.owner.toString()])];
      recipients.forEach(memberId => {
        createNotification({
          recipient: memberId,
          type: 'PROJECT_STATUS_UPDATED',
          title: 'Project Status Updated',
          message: `Project "${updatedProject.title}" is now marked as ${status}.`,
          relatedEntity: { entityType: 'project', entityId: updatedProject._id },
        }).catch(err => console.error('Notification failed:', err));
      });
    }

    return updatedProject;
  }

  async deleteProject(user, companyId, projectId) {
    const project = await Project.findOne({ _id: projectId, company: companyId });
    if (!project) throw new NotFoundError("Project");

    const userRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
    const isSuperAdmin = userRole === 'superadmin';
    const isAdmin = userRole === 'admin';
    const isManagerTech = userRole === 'manager' && user.isTechnician;
    const isOwner = project.owner && project.owner._id ? project.owner._id.toString() === (user.id || user._id).toString() : project.owner?.toString() === (user.id || user._id).toString();
    const isTeamMember = project.team.some(member => {
        return member && member._id ? member._id.toString() === (user.id || user._id).toString() : member.toString() === (user.id || user._id).toString();
    });
    
    if (!isSuperAdmin && !isAdmin && !isManagerTech && !isOwner && !isTeamMember) {
      throw new ForbiddenError("You do not have permission to access or modify this project.");
    }

    const tasksCount = await Task.countDocuments({ project: project._id, company: companyId });
    if (tasksCount > 0) {
      throw new BadRequestError("Cannot delete project with associated tasks");
    }

    const recipients = [...new Set([...project.team.map(id => id.toString()), project.owner.toString()])];
    recipients.forEach(memberId => {
      createNotification({
        recipient: memberId,
        type: 'PROJECT_DELETED',
        title: 'Project Deleted',
        message: `Project "${project.title}" has been deleted or archived.`,
        relatedEntity: { entityType: 'project', entityId: project._id },
      }).catch(err => console.error('Notification failed:', err));
    });

    await project.deleteOne();
  }

  async getUserProjects(user, companyId) {
    const userId = user.id || user._id;

    return Project.find({
      company: companyId,
      $or: [{ owner: userId }, { team: userId }],
    })
      .populate("team", "name email avatar")
      .populate("owner", "name email avatar");
  }

  async getProjectDashboard(user, companyId) {
    const userId = user.id || user._id;

    const activeProjects = await Project.countDocuments({
      company: companyId,
      status: { $in: ["Active", "In Progress"] },
      $or: [{ owner: userId }, { team: userId }],
    });

    const completedProjects = await Project.countDocuments({
      company: companyId,
      status: "Completed",
      $or: [{ owner: userId }, { team: userId }],
    });

    const openTasks = await Task.countDocuments({
      company: companyId,
      status: { $ne: "Done" },
      team: userId,
    });

    const projectGroups = await Project.countDocuments({
      company: companyId,
      $or: [{ owner: userId }, { team: userId }],
    });

    // Fetch lists for dynamic dashboard mapping
    const recentProjects = await Project.find({
      company: companyId,
      status: { $in: ["Active", "In Progress", "Planning"] },
      $or: [{ owner: userId }, { team: userId }],
    }).sort({ updatedAt: -1 }).limit(5);

    const recentTasks = await Task.find({
      company: companyId,
      status: { $ne: "Done" },
      team: userId,
    }).sort({ dueDate: 1 }).limit(5);

    return {
      activeProjects,
      completedProjects,
      openTasks,
      projectGroups,
      recentProjects,
      recentTasks,
    };
  }
}

module.exports = new ProjectService();
