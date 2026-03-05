const User = require("../models/userSchema");
const { UnauthorizedError } = require("../utils/ExpressError");

exports.getCurrentUser = async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError("User context missing");
  }

const user = await User.findById(req.user.id)
  .populate({
    path: "department",
    populate: {
      path: "members",
      model: "User",
      select: "name email designation avatar role empStatus"
    }
  })
  .populate({
    path: "reportsTo",
    select: "name email designation avatar role"
  });

  if (!user) {
    throw new UnauthorizedError("User record not found");
  }

  res.status(200).json({
    message: "Authenticated via Azure",
    user: user,
  });
};



// require("dotenv").config();
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
// const crypto = require("crypto");
// const User = require("../models/userSchema");
// const { info, error, debug } = require("../utils/logger");
// const {
//   BadRequestError,
//   NotFoundError,
//   UnauthorizedError,
// } = require("../utils/ExpressError");
// const BlacklistedToken = require("../models/BlacklistedTokenSchema");
// const { sendOTPEmail } = require("../config/emailConfig");
// const { sendForgotPasswordEmail } = require("../config/emailConfig");


// // Utility functions
// const generateToken = require("../utils/token").generateAccessToken;
// const generateRefreshToken = require("../utils/token").generateRefreshToken;

// const generateOTP = () => Math.floor(100000 + Math.random() * 900000);
// const generateResetToken = () => crypto.randomBytes(32).toString("hex");

// // 1. Login 
// exports.login = async (req, res) => {
//   const { email, password } = req.body;

//   info(`Login request received for email: ${email}`);
//   const user = await User.findOne({ email }).select("+password");
//   if (!user)
//     throw new BadRequestError("You are not registered. Please sign up first.");

//   const isMatch = bcrypt.compareSync(password, user.password);
//   if (!isMatch) throw new BadRequestError("Invalid password");

//   const otp = generateOTP();
//   const currentTime = new Date();
//   user.otp = otp;
//   user.otpGeneratedAt = currentTime;
//   user.otpExpires = new Date(currentTime.getTime() + 5 * 60 * 1000);
//   await user.save();

//   await sendOTPEmail({
//     to: email,
//     otp,
//     name: user.name
//   });


//   res.status(200).json({
//     message: "OTP sent to your email",
//     email: user.email,
//     name: user.name,
//     id: user._id,
//     role: user.role,
//     avatar: user?.avatar,
//     designation: user?.designation,
//     department: user?.department
//   });
// };

// exports.verifyOtp = async (req, res) => {
//   const { email, otp } = req.body;
//   const user = await User.findOne({ email });
//   if (!user || !user.otp || user.otpExpires < Date.now())
//     throw new BadRequestError("Invalid or expired OTP");
//   if (String(user.otp) !== String(otp)) throw new BadRequestError("Invalid OTP");

//   user.otp = undefined;
//   user.otpGeneratedAt = undefined;
//   user.otpExpires = undefined;

//   const accessToken = generateToken(user);
//   const refreshToken = generateRefreshToken(user);
//   user.refreshToken = refreshToken;
//   await user.save();

//   const isProd = process.env.NODE_ENV === "production";
//   res.cookie("refreshToken", refreshToken, {
//     httpOnly: true,
//     secure: isProd,
//     sameSite: isProd ? "None" : "Lax",
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//   });

//   res.status(200).json({
//     message: "OTP verified",
//     token: accessToken,
//     user: {
//       id: user._id,
//       email: user.email,
//       name: user.name,
//       role: user.role,
//     },
//   });
// };

// exports.resendOtp = async (req, res) => {
//   const { email } = req.body;
//   const user = await User.findOne({ email });
//   if (!user) throw new NotFoundError("User not found");

//   const otp = generateOTP();
//   const now = new Date();
//   user.otp = otp;
//   user.otpGeneratedAt = now;
//   user.otpExpires = new Date(now.getTime() + 5 * 60 * 1000);
//   await user.save();

//   await sendOTPEmail({
//     to: email,
//     otp,
//     name: user.name
//   });


//   res.status(200).json({
//     message: "New OTP sent to your email",
//     email: user.email,
//     name: user.name,
//     id: user._id,
//     role: user.role,
//   });
// };

// exports.forgotPassword = async (req, res) => {
//   const { email } = req.body;
//   const user = await User.findOne({ email });
//   if (!user) throw new NotFoundError("No user found with that email");

//   const resetToken = generateResetToken();
//   const hashedToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest("hex");

//   user.passwordResetToken = hashedToken;
//   user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
//   await user.save();
//   const resetURL = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;

//   await sendForgotPasswordEmail({
//     to: user.email,
//     name: user.name,
//     resetURL
//   });


//   res.status(200).json({
//     message: "Password reset link sent to your email",
//     email: user.email,
//     name: user.name,
//     id: user._id,
//   });
// };

// // 2. Verify Reset Token
// exports.verifyResetToken = async (req, res) => {
//   const { token } = req.params;

//   const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//   const user = await User.findOne({
//     passwordResetToken: hashedToken,
//     passwordResetExpires: { $gt: Date.now() },
//   });

//   if (!user) throw new BadRequestError("Token is invalid or expired");

//   res.status(200).json({ message: "Token is valid", email: user.email });
// };

// // 3. Reset Password with token
// exports.resetPassword = async (req, res) => {
//   const { token } = req.params;
//   const { password } = req.body;

//   const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//   const user = await User.findOne({
//     passwordResetToken: hashedToken,
//     passwordResetExpires: { $gt: Date.now() },
//   });

//   if (!user) throw new BadRequestError("Token is invalid or expired");

//   user.password = bcrypt.hashSync(password, 10);
//   user.passwordResetToken = undefined;
//   user.passwordResetExpires = undefined;
//   await user.save();

//   const newToken = generateToken(user);

//   res.status(200).json({
//     message: "Password reset successful",
//     token: newToken,
//     user: { id: user._id, name: user.name, email: user.email, role: user.role },
//   });
// };


// //Logout route
// exports.logout = async (req, res) => {
//   const { refreshToken } = req.cookies;

//   if (!refreshToken) throw new UnauthorizedError("No refresh token provided");

//   // Find user by refresh token
//   const user = await User.findOne({ refreshToken });
//   if (!user) throw new UnauthorizedError("Invalid refresh token");

//   // Blacklist refresh token
//   await BlacklistedToken.create({
//     token: refreshToken,
//     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
//   });

//   // Blacklist access token if present
//   const accessToken = req.headers.authorization?.split(" ")[1];
//   if (accessToken) {
//     await BlacklistedToken.create({
//       token: accessToken,
//       expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
//     });
//   }

//   // Clear refresh token on user model
//   user.refreshToken = null;
//   await user.save();

//   // Clear cookie
//   res.clearCookie("refreshToken", {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: process.env.NODE_ENV === "production" ? "None" : "strict",
//   });

//   res.status(200).json({ message: "Logged out successfully" });
// };


// exports.getCurrentUser = async (req, res) => {

//   if (!req.user) {
//     return res.status(401).json({ message: "User not authenticated" });
//   }
//   const user = await User.findById(req.user.id);

//   res.status(200).json({
//     message: "Authenticated",
//     user,
//   });
// };


// exports.refreshAccessToken = async (req, res) => {
//   const refreshToken = req.cookies?.refreshToken;
//   if (!refreshToken) throw new UnauthorizedError("No refresh token provided");

//   const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
//   const user = await User.findById(payload.id);
//   if (!user) throw new UnauthorizedError("User not found");

//   const accessToken = generateToken(user);
//   return res.status(200).json({ accessToken, user });
// };