const express = require("express");
const router = express.Router();
const {
  createLog,
  createInfoLog,
  createErrorLog,
  createWarnLog,
  createDebugLog,
  getAllLogs,
} = require("../../controllers/LogController");
const catchAsync = require("../../utils/catchAsync");

router.post("/", catchAsync(createLog));
router.post("/info", catchAsync(createInfoLog));
router.post("/error", catchAsync(createErrorLog));
router.post("/warn", catchAsync(createWarnLog));
router.post("/debug", catchAsync(createDebugLog));
router.get("/", catchAsync(getAllLogs));

module.exports = router;
