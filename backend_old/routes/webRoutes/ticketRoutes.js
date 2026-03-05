const express = require("express");
const router = express.Router();
const multer = require("multer");
const { ticketsAttachmentsStorage } = require("../../storageConfig");
const upload = multer({ storage: ticketsAttachmentsStorage });
const { isLoggedIn } = require("../../middlewares/authMiddleware");

const ticketController = require("../../controllers/ticketController");

router
  .route("/")
  .post(isLoggedIn, upload.single("attachment"), ticketController.createTicket)
  .get(ticketController.getUserTickets);

router
  .route("/all")
  .get(ticketController.getAllTickets);

router
  .route("/:id")
  .get(ticketController.getTicketById)
  .put(ticketController.updateTicket)
  .delete(ticketController.deleteTicket);

router.patch("/:id/status", ticketController.updateTicketStatus);
router.patch("/:id/priority", ticketController.updateTicketPriority);
router.patch("/:id/assign", ticketController.updateTicketAssignee);
router.post("/:id/response",isLoggedIn, ticketController.addTicketResponse);

// Add this route
router.get('/:id/attachments/:attachmentId/download', 
  isLoggedIn, 
  ticketController.downloadTicketAttachment
);


module.exports = router;
