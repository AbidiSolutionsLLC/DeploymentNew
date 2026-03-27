// projectController.js
const Project = require("../models/projectSchema");
const Task = require("../models/taskSchema");
const catchAsync = require("../utils/catchAsync");
const { NotFoundError, BadRequestError } = require("../utils/ExpressError");
const { createNotification } = require('../utils/notificationService');

// Create Project
exports.createProject = catchAsync(async (req, res) => {
  const { title, description, team, strict, isPublic, startDate, dueDate } = req.body;
  const owner = req.user.id || req.user._id;

  const project = new Project({
    title,
    description,
    team,
    owner,
    strict,
    isPublic,
    startDate,
    dueDate,
  });

  const savedProject = await project.save();

  // Notify all initial team members they've been added
  if (savedProject.team && savedProject.team.length > 0) {
    try {
      const notifPromises = savedProject.team.map(memberId =>
        createNotification({
          recipient: memberId,
          type: 'PROJECT_MEMBER_ADDED',
          title: 'Added to Project',
          message: `You have been added to the project "${savedProject.title}".`,
          relatedEntity: { entityType: 'project', entityId: savedProject._id },
        })
      );
      await Promise.all(notifPromises);
    } catch (notifErr) {
      console.error('[Notification] Project created:', notifErr.message);
    }
  }

  res.status(201).json(savedProject);
});

// Get All Projects
exports.getAllProjects = catchAsync(async (req, res) => {
  const projects = await Project.find()
    .populate("team", "name email")
    .populate("owner", "name email");
  res.status(200).json(projects);
});

// Get Project by ID
exports.getProjectById = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("team", "name email")
    .populate("owner", "name email");

  if (!project) throw new NotFoundError("Project");

  res.status(200).json(project);
});

// Update Project
exports.updateProject = catchAsync(async (req, res) => {
  const { title, description, team, status, strict, isPublic, startDate, dueDate } = req.body;

  const project = await Project.findById(req.params.id);
  if (!project) throw new NotFoundError("Project");

  const previousTeam = project.team.map(id => id.toString());

  // Update fields
  project.title = title || project.title;
  project.description = description || project.description;
  project.team = team || project.team;
  project.status = status || project.status;
  project.strict = strict !== undefined ? strict : project.strict;
  project.isPublic = isPublic !== undefined ? isPublic : project.isPublic;
  project.startDate = startDate || project.startDate;
  project.dueDate = dueDate || project.dueDate;

  const updatedProject = await project.save();

  // Notify newly added team members
  if (team && team.length > 0) {
    const newMembers = team.filter(id => !previousTeam.includes(id.toString()));
    if (newMembers.length > 0) {
      try {
        const notifPromises = newMembers.map(memberId =>
          createNotification({
            recipient: memberId,
            type: 'PROJECT_MEMBER_ADDED',
            title: 'Added to Project',
            message: `You have been added to the project "${updatedProject.title}".`,
            relatedEntity: { entityType: 'project', entityId: updatedProject._id },
          })
        );
        await Promise.all(notifPromises);
      } catch (notifErr) {
        console.error('[Notification] Project update:', notifErr.message);
      }
    }
  }

  res.status(200).json(updatedProject);
});

// Delete Project
exports.deleteProject = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new NotFoundError("Project");

  // Check if there are tasks associated with this project
  const tasksCount = await Task.countDocuments({ project: project._id });
  if (tasksCount > 0) {
    throw new BadRequestError("Cannot delete project with associated tasks");
  }

  await project.deleteOne();
  res.status(200).json({ message: "Project deleted successfully" });
});

// Get Projects for User
exports.getUserProjects = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id;

  const projects = await Project.find({
    $or: [{ owner: userId }, { team: userId }],
  })
    .populate("team", "name email")
    .populate("owner", "name email");

  res.status(200).json(projects);
});