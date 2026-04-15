const express = require("express");
const router = express.Router();
const multer = require("multer");
const { ticketsAttachmentsStorage } = require("../../storageConfig");
const { commonFileFilter, handleUpload } = require("../../middlewares/uploadMiddleware");
const upload = multer({
  storage: ticketsAttachmentsStorage,
  limits: { fileSize: 100 * 1024 * 1024, files: 5 },
  fileFilter: commonFileFilter
});
const ticketController = require("../../controllers/ticketController");
const validate = require("../../middlewares/validationMiddleware");
const { createTicketSchema, ticketResponseSchema } = require("../../JoiSchema/TicketJoiSchema");
const { isLoggedIn } = require("../../middlewares/authMiddleware");

// Base: /api/web/tickets

// --- FIX: Specific routes must come BEFORE dynamic routes like /:id ---
router.get("/all", isLoggedIn, ticketController.getAllTickets); 

router.route("/")
  .post(isLoggedIn, handleUpload(upload.array("attachments", 5)), validate(createTicketSchema), ticketController.createTicket)
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
router.post("/:id/response", isLoggedIn, validate(ticketResponseSchema), ticketController.addTicketResponse);

// --- DOWNLOAD ROUTE ---
router.get("/:id/attachment/:attachmentId", ticketController.downloadTicketAttachment);

module.exports = router;