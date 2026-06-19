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
const validate = require("../../middlewares/validationMiddleware");
const logValidationSchema = require("../../JoiSchema/LogJoiSchema");

router.post("/", validate(logValidationSchema), createLog);
router.post("/info", validate(logValidationSchema), createInfoLog);
router.post("/error", validate(logValidationSchema), createErrorLog);
router.post("/warn", validate(logValidationSchema), createWarnLog);
router.post("/debug", validate(logValidationSchema), createDebugLog);
router.get("/", getAllLogs);

module.exports = router;
