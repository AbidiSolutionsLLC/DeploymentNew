const express = require("express");
const router = express.Router();
const multer = require("multer");
const { memoryStorage } = require("../../storageConfig");
const upload = multer({ storage: memoryStorage });
const ticketController = require("../../controllers/ticketController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");

// Base: /api/web/tickets

router.route("/")
  .post(isLoggedIn, upload.single("attachment"), ticketController.createTicket)
  .get(isLoggedIn, ticketController.getAllTickets);

// Specific Ticket Operations
router.route("/:id")
  .get(isLoggedIn, ticketController.getTicketById)
  .put(isLoggedIn, ticketController.updateTicket)
  .delete(isLoggedIn, ticketController.deleteTicket);

// Status & Priority
router.patch("/:id/status", isLoggedIn, ticketController.updateTicketStatus);
router.patch("/:id/priority", isLoggedIn, ticketController.updateTicketPriority);

// Assign & Respond
router.patch("/:id/assign", isLoggedIn, ticketController.updateTicketAssignee);
router.post("/:id/response", isLoggedIn, ticketController.addTicketResponse);

// --- DOWNLOAD ROUTE (Fixes 404) ---
// Note: Matches the frontend call structure
router.get("/:id/attachment/:attachmentId", ticketController.downloadTicketAttachment);

module.exports = router;