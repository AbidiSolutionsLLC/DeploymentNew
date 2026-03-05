const express = require("express");
const router = express.Router();
const multer = require("multer");
const { timeLogsStorage } = require("../../storageConfig");
const upload = multer({ storage: timeLogsStorage });
const timeLogController = require("../../controllers/timeLogController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");

// Time Log Routes
router
    .route("/")
    .post(isLoggedIn, upload.array("attachments", 5), timeLogController.createTimeLog)
    .get(isLoggedIn, timeLogController.getEmployeeTimeLogs);

router
    .route("/:id")
    .put(isLoggedIn, upload.array("attachments", 5), timeLogController.updateTimeLog)
    .delete(isLoggedIn, timeLogController.deleteTimeLog);

router.get('/:id/attachments/:attachmentId/download', 
  isLoggedIn, 
  timeLogController.downloadTimeLogAttachment
);

module.exports = router;