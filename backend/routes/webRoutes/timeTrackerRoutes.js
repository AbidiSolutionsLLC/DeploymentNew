const express = require("express");
const router = express.Router();
const timeTrackerController = require("../../controllers/timeTrackerController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");

const getLogs = timeTrackerController.getAllTimeLogs || timeTrackerController.getAllTimeTrackers;
const createLog = timeTrackerController.createTimeLog || timeTrackerController.createTimeTracker;

// --- Base Routes ---
router.get("/", isLoggedIn, getLogs);
router.post("/", isLoggedIn, createLog);

// --- Operations ---
router.post("/check-in", isLoggedIn, timeTrackerController.checkIn);
router.post("/check-out", isLoggedIn, timeTrackerController.checkOut);

// --- Individual Records ---
router.get("/:id", isLoggedIn, timeTrackerController.getTimeLogById);
router.put("/:id", isLoggedIn, timeTrackerController.updateTimeLog);
router.delete("/:id", isLoggedIn, timeTrackerController.deleteTimeLog);

// --- FIX: Add BOTH route styles to satisfy the frontend ---
// 1. The one causing the 404 error (Month/Year format)
router.get("/attendance/:month/:year", isLoggedIn, timeTrackerController.getMonthlyAttendance);

// 2. The standard Year/Month format (Keep as backup)
router.get("/monthly/:year/:month", isLoggedIn, timeTrackerController.getMonthlyAttendance);

// --- Personal ---
router.get("/my/logs", isLoggedIn, timeTrackerController.getMyTimeLogs);
router.get("/my/daily/:userId", isLoggedIn, timeTrackerController.getDailyLog);

module.exports = router;
