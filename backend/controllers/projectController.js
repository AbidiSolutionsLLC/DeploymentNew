const projectService = require("../services/projectService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject(req.user, req.companyId, req.body);
  res.status(201).json(ApiResponse.success(project, 'Project created successfully'));
});

exports.getAllProjects = catchAsync(async (req, res) => {
  const result = await projectService.getAllProjects(req.user, req.companyId, req.query);
  res.status(200).json(ApiResponse.success(result.data, 'Projects retrieved successfully', result.pagination));
});

exports.getProjectById = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(project, 'Project retrieved successfully'));
});

exports.updateProject = catchAsync(async (req, res) => {
  const updatedProject = await projectService.updateProject(req.companyId, req.params.id, req.body);
  res.status(200).json(ApiResponse.success(updatedProject, 'Project updated successfully'));
});

exports.deleteProject = catchAsync(async (req, res) => {
  await projectService.deleteProject(req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(null, 'Project deleted successfully'));
});

exports.getUserProjects = catchAsync(async (req, res) => {
  const projects = await projectService.getUserProjects(req.user, req.companyId);
  res.status(200).json(ApiResponse.success(projects, 'User projects retrieved successfully'));
});