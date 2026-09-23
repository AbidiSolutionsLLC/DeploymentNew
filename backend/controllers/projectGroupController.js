const projectGroupService = require('../services/projectGroupService');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

exports.createGroup = catchAsync(async (req, res) => {
  const group = await projectGroupService.createGroup(req.user, req.companyId, req.body);
  return res.status(201).json(ApiResponse.success(group, 'Project group created successfully'));
});

exports.getAllGroups = catchAsync(async (req, res) => {
  const groups = await projectGroupService.getAllGroups(req.user, req.companyId);
  return res.status(200).json(ApiResponse.success(groups, 'Project groups retrieved successfully'));
});

exports.updateGroup = catchAsync(async (req, res) => {
  const group = await projectGroupService.updateGroup(req.user, req.companyId, req.params.id, req.body);
  return res.status(200).json(ApiResponse.success(group, 'Project group updated successfully'));
});

exports.deleteGroup = catchAsync(async (req, res) => {
  await projectGroupService.deleteGroup(req.user, req.companyId, req.params.id);
  return res.status(200).json(ApiResponse.success(null, 'Project group deleted successfully'));
});
