const express = require("express");
const router = express.Router();
const timeTrackerController = require("../../controllers/timeTrackerController");
const { isLoggedIn, restrictTo } = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validationMiddleware");
const { timeTrackerSchema, editTimeTrackerSchema } = require("../../JoiSchema/TimeTrackerJoiSchema");

// Apply authentication middleware to ALL routes
router.use(isLoggedIn);

// --- Operations ---
router.post("/check-in", timeTrackerController.checkIn);
router.post("/check-out", timeTrackerController.checkOut);

// --- Personal Logs / Daily Logs ---
router.get("/admin-summary", timeTrackerController.getAdminAttendanceSummary);
router.get("/my/logs", timeTrackerController.getMyTimeLogs);
router.get("/my/daily/:userId", timeTrackerController.getDailyLog);

// FIX: Added the exact route your frontend is fetching
router.get("/daily-log/:userId", timeTrackerController.getDailyLog);

// --- Monthly Attendance ---
router.get("/attendance/:month/:year", timeTrackerController.getMonthlyAttendance);
router.get("/monthly/:year/:month", timeTrackerController.getMonthlyAttendance);

// --- Base Routes ---
router.route("/")
  .get(timeTrackerController.getAllTimeLogs)
  .post(validate(timeTrackerSchema), timeTrackerController.createTimeLog);

// --- Individual Records (Dynamic :id MUST be at the very bottom) ---
router.route("/:id")
  .get(timeTrackerController.getTimeLogById)
  .put(restrictTo('Super Admin'), validate(editTimeTrackerSchema), timeTrackerController.updateTimeLog)
  .delete(restrictTo('Super Admin'), timeTrackerController.deleteTimeLog);

module.exports = router;