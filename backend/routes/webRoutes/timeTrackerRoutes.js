const express = require("express");
const router = express.Router();
const timeTrackerController = require("../../controllers/timeTrackerController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");

// Helper function to handle common aliases/mistakes in naming
const getLogs = timeTrackerController.getAllTimeLogs || timeTrackerController.getAllTimeTrackers;
const createLog = timeTrackerController.createTimeLog || timeTrackerController.createTimeTracker;

// --- Base Routes ---
router.get("/", isLoggedIn, getLogs);
router.post("/", isLoggedIn, createLog); // This is likely line 19 causing your error

// --- Operations ---
router.post("/check-in", isLoggedIn, timeTrackerController.checkIn);
router.post("/check-out", isLoggedIn, timeTrackerController.checkOut);

// --- Individual Records ---
router.get("/:id", isLoggedIn, timeTrackerController.getTimeLogById);
router.put("/:id", isLoggedIn, timeTrackerController.updateTimeLog);
router.delete("/:id", isLoggedIn, timeTrackerController.deleteTimeLog);

// --- Monthly View ---
router.get("/monthly/:year/:month", isLoggedIn, timeTrackerController.getMonthlyAttendance);

// --- Personal ---
router.get("/my/logs", isLoggedIn, timeTrackerController.getMyTimeLogs);
router.get("/my/daily/:userId", isLoggedIn, timeTrackerController.getDailyLog);

module.exports = router;
