const express = require("express");
const router = express.Router();
const testController = require("../../controllers/testEmailController");

router.post("/checkin", testController.testCheckInReminder);
router.post("/checkout", testController.testCheckoutReminder);
router.post("/timesheet", testController.testTimesheetReminder);
router.post("/ticket-created", testController.testTicketCreated);
router.post("/ticket-assigned", testController.testTicketAssigned);
router.post("/user-invite", testController.testUserInvite);

module.exports = router;
