const folderService = require("../services/folderService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.getContents = catchAsync(async (req, res, next) => {
  const data = await folderService.getContents(req.user, req.params.id);
  res.status(200).json(ApiResponse.success(data, 'Folder contents retrieved'));
});

exports.create = catchAsync(async (req, res, next) => {
  const folder = await folderService.create(req.user, req.body, req.file);
  res.status(201).json(ApiResponse.success({ folder }, 'Folder created successfully'));
});

exports.softDeleteFolder = catchAsync(async (req, res, next) => {
  const folder = await folderService.softDeleteFolder(req.user, req.params.folderId);
  res.status(200).json(ApiResponse.success({ folder }, 'Folder deleted successfully'));
});

exports.getAllFolders = catchAsync(async (req, res, next) => {
  const folders = await folderService.getAllFolders(req.user);
  res.status(200).json(ApiResponse.success({ folders }, 'Folders retrieved', { results: folders.length }));
});