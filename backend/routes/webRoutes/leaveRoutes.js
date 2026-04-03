const express = require("express");
const router = express.Router();
const leaveController = require("../../controllers/leaveRequest");
const catchAsync = require("../../utils/catchAsync");
const { isLoggedIn } = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validationMiddleware");
const { leaveSchema, leaveResponseSchema } = require("../../JoiSchema/LeaveJoiSchema");
 
router.use(isLoggedIn);
 
// --- FIX: Add the specific route the frontend is calling ---
router.get("/getAllLeaves", leaveController.getLeaveRequests);
 
// Main leave request routes
router
  .route("/")
  .post(validate(leaveSchema), leaveController.createLeaveRequest)
  .get(leaveController.getLeaveRequests);
 
// Single leave request routes
router
  .route("/:id")
  .get(leaveController.getLeaveRequestById)
  .put(validate(leaveSchema), leaveController.updateLeaveRequest)
  .delete(leaveController.deleteLeaveRequest);
 
// Status update route
router.put("/:id/status", leaveController.updateLeaveStatus);
 
// ============================================
// RESPONSE ROUTES (NEW ADDITIONS)
// ============================================
 
// Get all responses for a leave request
router.get("/:id/responses", leaveController.getLeaveRequestResponses);
 
// Add a new response to a leave request
router.post("/:id/responses", validate(leaveResponseSchema), leaveController.addLeaveResponse);
 
// Get single response
router.get("/:id/responses/:responseId", leaveController.getLeaveRequestResponses);
 
// Update a response
router.patch("/:id/responses/:responseId", validate(leaveResponseSchema), leaveController.updateLeaveResponse);
 
// Delete a response
router.delete("/:id/responses/:responseId", leaveController.deleteLeaveResponse);
 
module.exports = router; 
