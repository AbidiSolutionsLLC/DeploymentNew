const express = require("express");
const router = express.Router();
const timeTrackerController = require("../../controllers/timeTrackerController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");

router.use(isLoggedIn);

// Main Check In/Out
router.post('/check-in', timeTrackerController.checkIn);
router.post('/check-out', timeTrackerController.checkOut);

// Data Retrieval
router.get('/daily-log/:userId', timeTrackerController.getDailyLog);
router.get('/attendance/:month/:year', timeTrackerController.getMonthlyAttendance); // Assuming this controller exists in your file
// router.get('/open-sessions', ...); // Optional based on your needs

// CRUD (Admin or specific use cases)
router.route("/")
  .post(timeTrackerController.createTimeLog) // Manual create
  .get(timeTrackerController.getAllTimeLogs); // Admin get all

router.route("/:id")
  .get(timeTrackerController.getTimeLogById)
  // .put(timeTrackerController.updateTimeLog) // Be careful exposing update without validation
  // .delete(timeTrackerController.deleteTimeLog);

module.exports = router;