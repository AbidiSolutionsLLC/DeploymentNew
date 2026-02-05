const Ticket = require("../models/ticketManagementSchema");
const User = require("../models/userSchema");
const catchAsync = require("../utils/catchAsync");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../utils/ExpressError");
const { containerClient } = require("../config/azureConfig");
const { getSearchScope } = require("../utils/rbac");
const sendEmail = require('../utils/emailService');

// --- 1. CREATE TICKET ---
exports.createTicket = catchAsync(async (req, res) => {
  const { emailAddress, subject, description } = req.body;
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const ticketID = `TKT-${timestamp}-${random}`;

  const newTicket = {
    emailAddress,
    subject,
    description,
    ticketID,
    attachments: [],
    closedBy: req.user?.id,
    assignedTo: null
  };

  if (req.file) {
    newTicket.attachments.push({
      name: req.file.originalname,
      url: req.file.url || req.file.path,
      blobName: req.file.blobName
    });
  }

  const ticket = new Ticket(newTicket);
  ticket.status = 'Open';
  ticket.priority = 'Medium Priority';
  const savedTicket = await ticket.save();

  // Notify submitter and admins
  const admins = await User.find({
    $or: [
      { role: 'Admin' },
      { role: 'Super Admin' },
      { role: 'Manager', isTechnician: true }
    ]
  });  
  const adminEmails = admins.map(admin => admin.email);
  const recipients = [...new Set([emailAddress, ...adminEmails])];

  sendTicketCreationEmail(recipients, savedTicket).catch(console.error);
  res.status(201).json(savedTicket);
});

// --- 2. GET ALL TICKETS ---
exports.getAllTickets = catchAsync(async (req, res) => {
  let query = {};
  const isSuperAdmin = req.user.role === 'Super Admin';
  const isAdmin = req.user.role === 'Admin';
  const isManagerTech = req.user.role === 'Manager' && req.user.isTechnician === true;

  if (!(isSuperAdmin || isAdmin || isManagerTech)) {
    const rbacFilter = await getSearchScope(req.user, 'ticket');
    if (rbacFilter.user) query.closedBy = rbacFilter.user;
    else Object.assign(query, rbacFilter);
  }

  const tickets = await Ticket.find(query)
    .populate('closedBy', 'name email avatar')
    .populate('assignedTo', 'name email avatar')
    .sort({ createdAt: -1 });

  res.status(200).json(tickets);
});

// --- 3. GET SINGLE TICKET ---
exports.getTicketById = catchAsync(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('closedBy', 'name email avatar')
    .populate('assignedTo', 'name email avatar');
  if (!ticket) throw new NotFoundError("Ticket");
  res.status(200).json(ticket);
});

// --- 4. UPDATE TICKET ---
exports.updateTicket = catchAsync(async (req, res) => {
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!ticket) throw new NotFoundError("Ticket");
  res.status(200).json(ticket);
});

// --- 5. DELETE TICKET ---
exports.deleteTicket = catchAsync(async (req, res) => {
  const ticket = await Ticket.findByIdAndDelete(req.params.id);
  if (!ticket) throw new NotFoundError("Ticket");
  res.status(200).json({ message: "Ticket deleted successfully" });
});

// --- 6. UPDATE STATUS ---
exports.updateTicketStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const statusMap = { "opened": "Open", "open": "Open", "unattended": "Open", "in progress": "In Progress", "closed": "Closed" };
  const normalizedStatus = statusMap[status?.toLowerCase()] || "Open";

  const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status: normalizedStatus }, { new: true });
  if (!ticket) throw new NotFoundError("Ticket");
  res.status(200).json(ticket);
});

// --- 7. UPDATE PRIORITY ---
exports.updateTicketPriority = catchAsync(async (req, res) => {
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, { priority: req.body.priority }, { new: true });
  if (!ticket) throw new NotFoundError("Ticket");
  res.status(200).json(ticket);
});

// --- 8. ASSIGN TICKET ---
exports.updateTicketAssignee = catchAsync(async (req, res) => {
  const { assignedTo } = req.body;
  const userToAssign = await User.findById(assignedTo);
  if (!userToAssign) throw new NotFoundError("User");

  const ticket = await Ticket.findByIdAndUpdate(req.params.id, { assignedTo }, { new: true }).populate('assignedTo');
  if (!ticket) throw new NotFoundError("Ticket");

  sendAssignmentEmail(userToAssign.email, ticket).catch(console.error);
  res.status(200).json(ticket);
});

// --- 9. ADD RESPONSE (Back-n-Forth Email Integrated) ---
exports.addTicketResponse = catchAsync(async (req, res) => {
  const { content, avatar } = req.body;
  const ticket = await Ticket.findById(req.params.id).populate('assignedTo');
  if (!ticket) throw new NotFoundError("Ticket");

  const newResponse = {
    author: req.user?.name || "Unknown",
    content,
    time: new Date().toISOString(),
    avatar: req.user?.avatar || avatar || ""
  };

  ticket.responses.push(newResponse);
  await ticket.save();

  // Determine recipient for back-and-forth
  const isAuthorSubmitter = req.user.email === ticket.emailAddress;
  const recipient = isAuthorSubmitter ? ticket.assignedTo?.email : ticket.emailAddress;

  if (recipient) {
    const subject = `Update on Ticket #${ticket.ticketID}`;
    const body = `<strong>${newResponse.author}</strong> added a response: <br><br>${content}`;
    sendEmail(recipient, subject, body).catch(err => console.error("Email failed:", err.message));
  }

  res.status(200).json(ticket);
});

// --- 10. DOWNLOAD ---
exports.downloadTicketAttachment = catchAsync(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  const attachment = ticket.attachments.id(req.params.attachmentId);
  if (attachment?.blobName) {
    const sasUrl = await containerClient.getBlockBlobClient(attachment.blobName).generateSasUrl({
      permissions: "r", expiresOn: new Date(new Date().valueOf() + 300 * 1000),
      contentDisposition: `attachment; filename="${attachment.name}"`
    });
    return res.redirect(sasUrl);
  }
  return res.redirect(attachment.url);
});

// --- 11. USER SPECIFIC ---
exports.getUserTickets = catchAsync(async (req, res) => {
  const tickets = await Ticket.find({ emailAddress: req.query.email }).populate('closedBy assignedTo');
  res.status(200).json(tickets);
});

// =========================================================
// EMAIL HELPERS & TEMPLATES (PRESERVED)
// =========================================================
const sendTicketCreationEmail = async (recipients, ticket) => {
  const subject = `New Ticket Created - #${ticket.ticketID}`;
  recipients.forEach(email => sendEmail(email, subject, generateTicketEmailTemplate(ticket)).catch(console.error));
};

const sendAssignmentEmail = async (email, ticket) => {
  sendEmail(email, `Assigned: #${ticket.ticketID}`, generateAssignmentEmailTemplate(ticket)).catch(console.error);
};

const generateTicketEmailTemplate = (ticket) => `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
.email-container { background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; }
.header { background-color: #497a71; color: white; padding: 20px; text-align: center; }
.content { padding: 25px; }
.ticket-card { background-color: #f5f5f5; border-left: 4px solid #497a71; padding: 15px; margin-bottom: 20px; border-radius: 0 4px 4px 0; }
.ticket-id { font-size: 18px; font-weight: bold; color: #497a71; margin-bottom: 10px; }
</style></head><body><div class="email-container"><div class="header"><h1>New Support Ticket Created</h1></div>
<div class="content"><p>A new ticket has been created details:</p><div class="ticket-card">
<div class="ticket-id">Ticket #${ticket.ticketID}</div><p><strong>Subject:</strong> ${ticket.subject}</p>
<p><strong>Description:</strong> ${ticket.description}</p></div></div></div></body></html>`;

const generateAssignmentEmailTemplate = (ticket) => `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
.email-container { background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; }
.header { background-color: #497a71; color: white; padding: 20px; text-align: center; }
.content { padding: 25px; }
.ticket-card { background-color: #f5f5f5; border-left: 4px solid #497a71; padding: 15px; margin-bottom: 20px; border-radius: 0 4px 4px 0; }
</style></head><body><div class="email-container"><div class="header"><h1>Ticket Assignment</h1></div>
<div class="content"><p>You have been assigned a new ticket:</p><div class="ticket-card">
<p><strong>Ticket ID:</strong> #${ticket.ticketID}</p><p><strong>Subject:</strong> ${ticket.subject}</p>
</div></div></div></body></html>`;
