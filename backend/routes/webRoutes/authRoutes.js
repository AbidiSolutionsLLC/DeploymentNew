const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../../middlewares/authMiddleware");
const authController = require("../../controllers/authController");
const userController = require("../../controllers/userController");

router.post("/setup-admin", userController.createInitialSuperAdmin);

// Onboarding Route
router.post("/register-company", authController.registerCompany);

// Auth Routes
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/logout", authController.logout);
router.get("/refresh-token", authController.refreshAccessToken);

// Password Reset
router.post("/forgot-password", authController.forgotPassword);
router.get("/verify-reset-token/:token", authController.verifyResetToken);
router.post("/reset-password/:token", authController.resetPassword);

// Protected Routes
router.use(isLoggedIn);
router.get("/me", authController.getCurrentUser);

module.exports = router;
