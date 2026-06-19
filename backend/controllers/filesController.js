const fileService = require("../services/fileService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError } = require("../utils/ExpressError");

exports.register = catchAsync(async (req, res) => {
  if (!req.file) throw new BadRequestError('No file uploaded');
  const file = await fileService.register(req.user, req.file, req.body);
  res.status(201).json(ApiResponse.success({ file }, "File registered successfully"));
});

exports.downloadUrl = catchAsync(async (req, res) => {
  const data = await fileService.getDownloadUrl(req.user, req.params.fileId);
  res.status(200).json(ApiResponse.success(data, "Download URL generated"));
});

exports.softDeleteFile = catchAsync(async (req, res) => {
  const file = await fileService.softDeleteFile(req.user, req.params.fileId);
  res.status(200).json(ApiResponse.success({ file }, "File soft deleted"));
});

exports.upload = catchAsync(async (req, res) => {
  if (!req.file) throw new BadRequestError('No file uploaded');
  const file = await fileService.upload(req.user, req.file, req.body);
  res.status(201).json(ApiResponse.success({ file }, "File uploaded successfully"));
});

exports.updateAccess = catchAsync(async (req, res) => {
  const file = await fileService.updateAccess(req.user, req.params.fileId, req.body);
  res.status(200).json(ApiResponse.success({ file }, "Access controls updated"));
});

exports.getAccessibleFiles = catchAsync(async (req, res) => {
  const files = await fileService.getAccessibleFiles(req.user);
  res.status(200).json(ApiResponse.success(files, "Accessible files retrieved", { results: files.length }));
});

exports.getPublicFiles = catchAsync(async (req, res) => {
  const files = await fileService.getPublicFiles();
  res.status(200).json(ApiResponse.success({ files }, "Public files retrieved", { results: files.length }));
});

exports.getSharedWithMe = catchAsync(async (req, res) => {
  const files = await fileService.getSharedWithMe(req.user);
  res.status(200).json(ApiResponse.success({ files }, "Shared files retrieved", { results: files.length }));
});

exports.getMyFiles = catchAsync(async (req, res) => {
  const files = await fileService.getMyFiles(req.user);
  res.status(200).json(ApiResponse.success({ files }, "My files retrieved", { results: files.length }));
});