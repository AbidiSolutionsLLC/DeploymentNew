const express = require("express");
const router = express.Router();
const multer = require("multer");
const { timesheetsStorage } = require("../../storageConfig");
const { commonFileFilter, handleUpload } = require("../../middlewares/uploadMiddleware");
const upload = multer({ 
  storage: timesheetsStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: commonFileFilter
});
const timesheetController = require("../../controllers/timesheetController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");

// Timesheet Routes
router
    .route("/")
    .post(isLoggedIn, handleUpload(upload.array("attachments", 5)), timesheetController.createTimesheet)
    .get(isLoggedIn, timesheetController.getEmployeeTimesheets);

router.get("/all", isLoggedIn, timesheetController.getAllTimesheets);

router.get("/admin/all", isLoggedIn, timesheetController.getAllTimesheets);
router.get("/weekly", isLoggedIn, timesheetController.getWeeklyTimesheets);

router
    .route("/:id")
    .get(isLoggedIn, timesheetController.getTimesheetById)
    .put(isLoggedIn, handleUpload(upload.array("attachments", 5)), timesheetController.updateTimesheetStatus);

router.put("/:id/status", isLoggedIn, timesheetController.updateTimesheetStatus);

router.post("/:id/comment", isLoggedIn, timesheetController.addTimesheetComment);

router.get('/:id/attachments/:attachmentId/download', 
  isLoggedIn, 
  timesheetController.downloadAttachment
);    

module.exports = router;