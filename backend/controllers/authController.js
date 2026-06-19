require("dotenv").config();
const authService = require("../services/authService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync"); // Need this wrapper

exports.registerCompany = catchAsync(async (req, res) => {
  const { newUser, newCompany } = await authService.registerCompany(req.body);
  
  res.status(201).json(ApiResponse.success(
    { email: newUser.email, name: newUser.name, id: newUser._id, company: newCompany._id },
    "Company registered successfully. OTP sent to your email."
  ));
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.login(email, password);

  res.status(200).json(ApiResponse.success(
    { email: user.email, name: user.name, id: user._id, role: user.role, avatar: user?.avatar, designation: user?.designation, department: user?.department },
    "OTP sent to your email"
  ));
});

exports.verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const { user, accessToken, refreshToken } = await authService.verifyOtp(email, otp);

  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json(ApiResponse.success(
    { token: accessToken, user: { id: user._id, email: user.email, name: user.name, role: user.role, company: user.company } },
    "OTP verified"
  ));
});

exports.resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await authService.resendOtp(email);

  res.status(200).json(ApiResponse.success(
    { email: user.email, name: user.name, id: user._id, role: user.role },
    "New OTP sent to your email"
  ));
});

exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const frontendUrl = process.env.FRONTEND_URL;
  const user = await authService.forgotPassword(email, frontendUrl);

  res.status(200).json(ApiResponse.success(
    { email: user.email, name: user.name, id: user._id },
    "Password reset link sent to your email"
  ));
});

exports.verifyResetToken = catchAsync(async (req, res) => {
  const { token } = req.params;
  const user = await authService.verifyResetToken(token);

  res.status(200).json(ApiResponse.success({ email: user.email }, "Token is valid"));
});

exports.resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const { user, newToken } = await authService.resetPassword(token, password);

  res.status(200).json(ApiResponse.success(
    { token: newToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
    "Password reset successful"
  ));
});

exports.logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  const accessToken = req.headers.authorization?.split(" ")[1];

  await authService.logout(refreshToken, accessToken);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "strict",
  });

  res.status(200).json(ApiResponse.success(null, "Logged out successfully"));
});

exports.getCurrentUser = catchAsync(async (req, res) => {
  if (!req.user || !req.user.id) {
    const { UnauthorizedError } = require("../utils/ExpressError");
    throw new UnauthorizedError("User context missing");
  }

  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json(ApiResponse.success({ user }, "Authenticated"));
});

exports.refreshAccessToken = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  const { accessToken, user } = await authService.refreshAccessToken(refreshToken, process.env.JWT_REFRESH_SECRET);
  return res.status(200).json(ApiResponse.success({ accessToken, user }, "Token refreshed"));
});