const express = require("express");
const router = express.Router();
const adminDashboardController = require("../../controllers/adminDashboardController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");

router.get(
  "/stats", 
  isLoggedIn, 
  adminDashboardController.getDashboardStats
);

module.exports = router;