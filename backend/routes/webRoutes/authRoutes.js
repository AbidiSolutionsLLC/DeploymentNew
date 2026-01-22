const express = require("express");
const router = express.Router();
const catchAsync = require("../../utils/catchAsync");
const { isLoggedIn } = require("../../middlewares/authMiddleware");
const authController = require("../../controllers/authController");

router.use(isLoggedIn);

router.get("/me", catchAsync(authController.getCurrentUser));

module.exports = router;


// const express = require("express");
// const router = express.Router();
// const catchAsync = require("../../utils/catchAsync");
// const { isLoggedIn } = require("../../middlewares/authMiddleware");
// const authController = require("../../controllers/authController");

// // Auth Routes
// router.post("/login", catchAsync(authController.login));
// router.post("/verify-otp", catchAsync(authController.verifyOtp));
// router.post("/resend-otp", catchAsync(authController.resendOtp));
// router.post("/logout", catchAsync(authController.logout));
// router.get("/me", isLoggedIn, catchAsync(authController.getCurrentUser));
// router.get("/refresh-token", catchAsync(authController.refreshAccessToken));


// // Password Reset
// router.post("/forgot-password", catchAsync(authController.forgotPassword));
// router.get("/verify-reset-token/:token", catchAsync(authController.verifyResetToken));
// router.post("/reset-password/:token", catchAsync(authController.resetPassword));

// module.exports = router;
