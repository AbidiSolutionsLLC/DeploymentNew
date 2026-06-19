const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");
const Company = require("../models/companySchema");
const BlacklistedToken = require("../models/BlacklistedTokenSchema");
const { sendOTPEmail, sendForgotPasswordEmail } = require("../config/emailConfig");
const { BadRequestError, NotFoundError, UnauthorizedError } = require("../utils/ExpressError");
const generateToken = require("../utils/token").generateAccessToken;
const generateRefreshToken = require("../utils/token").generateRefreshToken;
const { ROLES } = require("../constants");

class AuthService {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
  }

  generateResetToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  async registerCompany(data) {
    const { companyName, industry, size, website, firstName, lastName, email, password } = data;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestError("Email is already registered.");
    }

    const newCompany = await Company.create({
      name: companyName,
      industry,
      size,
      website,
      plan: "trial"
    });

    const newUser = await userRepository.create({
      name: `${firstName} ${lastName}`,
      email,
      password,
      company: newCompany._id,
      role: ROLES.ADMIN,
      empStatus: "Active"
    });

    const otp = this.generateOTP();
    const hashedOtp = bcrypt.hashSync(String(otp), 10);
    const currentTime = new Date();
    newUser.otp = hashedOtp;
    newUser.otpGeneratedAt = currentTime;
    newUser.otpExpires = new Date(currentTime.getTime() + 5 * 60 * 1000);
    await newUser.save();

    try {
      await sendOTPEmail({ to: email, otp, name: newUser.name });
    } catch (err) {
      console.error("Error sending OTP email during registration: " + err.message);
    }

    return { newUser, newCompany };
  }

  async login(email, password) {
    const user = await userRepository.findByEmailWithAuth(email);
    if (!user) throw new BadRequestError("You are not registered. Please sign up first.");

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) throw new BadRequestError("Invalid password");

    const otp = this.generateOTP();
    const hashedOtp = bcrypt.hashSync(String(otp), 10);
    const currentTime = new Date();
    user.otp = hashedOtp;
    user.otpGeneratedAt = currentTime;
    user.otpExpires = new Date(currentTime.getTime() + 5 * 60 * 1000);
    await user.save();

    try {
      await sendOTPEmail({ to: email, otp, name: user.name });
    } catch (err) {
      console.error("Error sending OTP email: " + err.message);
    }

    return user;
  }

  async verifyOtp(email, otp) {
    const user = await userRepository.findByEmailWithAuth(email);
    if (!user || !user.otp || user.otpExpires < Date.now())
      throw new BadRequestError("Invalid or expired OTP");

    const isMatch = bcrypt.compareSync(String(otp), user.otp);
    if (!isMatch) throw new BadRequestError("Invalid OTP");

    user.otp = undefined;
    user.otpGeneratedAt = undefined;
    user.otpExpires = undefined;

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  }

  async resendOtp(email) {
    const user = await userRepository.findByEmailWithAuth(email);
    if (!user) throw new NotFoundError("User not found");

    const otp = this.generateOTP();
    const hashedOtp = bcrypt.hashSync(String(otp), 10);
    const now = new Date();
    user.otp = hashedOtp;
    user.otpGeneratedAt = now;
    user.otpExpires = new Date(now.getTime() + 5 * 60 * 1000);
    await user.save();

    try {
      await sendOTPEmail({ to: email, otp, name: user.name });
    } catch (err) {
      console.error("Error sending OTP email: " + err.message);
    }

    return user;
  }

  async forgotPassword(email, frontendUrl) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new NotFoundError("No user found with that email");

    const resetToken = this.generateResetToken();
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetURL = `${frontendUrl}/auth/reset-password/${resetToken}`;

    try {
      await sendForgotPasswordEmail({ to: user.email, name: user.name, resetURL });
    } catch (err) {
      console.error("Error sending forgot password email: " + err.message);
    }

    return user;
  }

  async verifyResetToken(token) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await userRepository.findByResetToken(hashedToken);
    if (!user) throw new BadRequestError("Token is invalid or expired");
    return user;
  }

  async resetPassword(token, password) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await userRepository.findByResetToken(hashedToken);
    if (!user) throw new BadRequestError("Token is invalid or expired");

    user.password = password; // Will be hashed by pre-save hook
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const newToken = generateToken(user);
    return { user, newToken };
  }

  async logout(refreshToken, accessToken) {
    if (!refreshToken) throw new UnauthorizedError("No refresh token provided");

    const user = await userRepository.findByRefreshToken(refreshToken);
    if (!user) throw new UnauthorizedError("Invalid refresh token");

    await BlacklistedToken.create({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    if (accessToken) {
      await BlacklistedToken.create({
        token: accessToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
    }

    user.refreshToken = null;
    await user.save();
  }

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId, {
      populate: [
        {
          path: "department",
          populate: {
            path: "members",
            model: "User",
            select: "name email designation avatar role empStatus"
          }
        },
        {
          path: "reportsTo",
          select: "name email designation avatar role"
        }
      ]
    });
    
    if (!user) throw new UnauthorizedError("User record not found");
    return user;
  }

  async refreshAccessToken(refreshToken, jwtSecret) {
    const payload = jwt.verify(refreshToken, jwtSecret);
    const user = await userRepository.findById(payload.id);
    if (!user) throw new UnauthorizedError("User not found");

    const accessToken = generateToken(user);
    return { accessToken, user };
  }
}

module.exports = new AuthService();
