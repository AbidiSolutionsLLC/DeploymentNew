const userService = require("../services/userService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

const getFileUrl = (req) => {
  if (!req.file) return null;
  if (req.file.url) return req.file.url; 
  if (req.file.location) return req.file.location; 
  let cleanPath = req.file.path.replace(/\\/g, "/");
  cleanPath = cleanPath.replace(/^public\//, "");
  return `${req.protocol}://${req.get('host')}/${cleanPath}`;
};

exports.createInitialSuperAdmin = catchAsync(async (req, res) => {
  const savedUser = await userService.createInitialSuperAdmin(req.body);
  res.status(201).json(ApiResponse.success(
    { id: savedUser._id, email: savedUser.email, name: savedUser.name, role: savedUser.role },
    "Initial Super Admin created successfully."
  ));
});

exports.createUser = catchAsync(async (req, res) => {
  const savedUser = await userService.createUser(req.user, req.body);
  res.status(201).json(ApiResponse.success(savedUser, "User invited successfully."));
});

exports.resendInvitation = catchAsync(async (req, res) => {
  const user = await userService.resendInvitation(req.user, req.params.id);
  res.status(200).json(ApiResponse.success(null, `Invitation resent to ${user.email}`));
});

exports.getAllUsers = catchAsync(async (req, res) => {
  const result = await userService.getAllUsers(req.user, req.query, req.companyId);
  res.status(200).json(ApiResponse.success(result.data, "Users retrieved successfully", result.pagination));
});

exports.getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json(ApiResponse.success(user));
});

exports.getUserSummary = catchAsync(async (req, res) => {
  const data = await userService.getUserSummary(req.params.id, req.companyId);
  res.status(200).json(ApiResponse.success(data));
});

exports.updateUser = catchAsync(async (req, res) => {
  const updatedUser = await userService.updateUser(req.user, req.params.id, req.body);
  res.status(200).json(ApiResponse.success(updatedUser));
});

exports.deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.user, req.params.id);
  res.status(200).json(ApiResponse.success(null, "User deleted successfully"));
});

exports.getUserByRole = catchAsync(async (req, res) => {
  const users = await userService.getUserByRole(req.params.role, req.user.company);
  res.status(200).json(ApiResponse.success(users));
});

exports.getDashboardCards = catchAsync(async (req, res) => {
  const cards = await userService.getDashboardCards(req.params.id);
  res.status(200).json(ApiResponse.success(cards));
});

exports.addDashboardCard = catchAsync(async (req, res) => {
  const cards = await userService.addDashboardCard(req.params.id, req.body.type);
  res.status(201).json(ApiResponse.success(cards));
});

exports.removeDashboardCard = catchAsync(async (req, res) => {
  const cards = await userService.removeDashboardCard(req.params.id, req.params.cardId);
  res.status(200).json(ApiResponse.success(cards));
});

exports.getUserLeaves = catchAsync(async (req, res) => {
  const leaves = await userService.getUserLeaves(req.params.id);
  res.status(200).json(ApiResponse.success(leaves));
});

exports.updateUserLeaves = catchAsync(async (req, res) => {
  const leaves = await userService.updateUserLeaves(req.user, req.params.id, req.body);
  res.status(200).json(ApiResponse.success(leaves));
});

exports.getUserLeaveHistory = catchAsync(async (req, res) => {
  const history = await userService.getUserLeaveHistory(req.params.id);
  res.status(200).json(ApiResponse.success(history));
});

exports.getUpcomingBirthdays = catchAsync(async (req, res) => {
  const birthdays = await userService.getUpcomingBirthdays(req.user.company);
  res.status(200).json(ApiResponse.success(birthdays));
});

exports.uploadAvatar = catchAsync(async (req, res) => {
  const fileUrl = getFileUrl(req);
  if (!fileUrl) {
    const { BadRequestError } = require("../utils/ExpressError");
    throw new BadRequestError('No file uploaded');
  }
  const avatarUrl = await userService.uploadAvatar(req.user, req.params.id, fileUrl);
  res.status(200).json(ApiResponse.success({ avatarUrl }));
});

exports.getOrgChart = catchAsync(async (req, res) => {
  const chart = await userService.getOrgChart(req.user.company);
  res.status(200).json(ApiResponse.success(chart));
});

exports.uploadCover = catchAsync(async (req, res) => {
  const fileUrl = getFileUrl(req);
  if (!fileUrl) {
    const { BadRequestError } = require("../utils/ExpressError");
    throw new BadRequestError('No file uploaded');
  }
  const coverUrl = await userService.uploadCover(req.user, req.params.id, fileUrl);
  res.status(200).json(ApiResponse.success({ coverUrl }));
});

exports.updateMyProfile = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const user = await userService.updateMyProfile(userId, req.body);
  res.status(200).json(ApiResponse.success(user));
});

exports.updateMySettings = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const user = await userService.updateMySettings(userId, req.body);
  res.status(200).json(ApiResponse.success(user));
});