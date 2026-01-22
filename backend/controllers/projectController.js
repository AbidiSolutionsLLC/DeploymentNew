// projectController.js
const Project = require("../models/projectSchema");
const Task = require("../models/taskSchema");
const catchAsync = require("../utils/catchAsync");
const { NotFoundError, BadRequestError } = require("../utils/ExpressError");

// Create Project
exports.createProject = catchAsync(async (req, res) => {
  const { title, description, team, strict, isPublic, startDate, dueDate } = req.body;
  const owner = req.user._id;

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
  const userId = req.user._id;

  const projects = await Project.find({
    $or: [{ owner: userId }, { team: userId }],
  })
    .populate("team", "name email")
    .populate("owner", "name email");

  res.status(200).json(projects);
});