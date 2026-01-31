const Ticket = require("../models/ticketManagementSchema");
const User = require("../models/userSchema");
const catchAsync = require("../utils/catchAsync");
const { NotFoundError, BadRequestError } = require("../utils/ExpressError");
const { containerClient, containerName } = require("../config/azureConfig");
const { getSearchScope } = require("../utils/rbac"); 
const axios = require("axios");
const sendEmail = require('../utils/emailService');

// --- 1. CREATE TICKET ---
exports.createTicket = catchAsync(async (req, res) => {
  const { emailAddress, subject, description } = req.body;

  // Generate unique ticket ID using timestamp
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const ticketID = `TKT-${timestamp}-${random}`;

  const newTicket = {
    emailAddress,
    subject,
    description,
    ticketID,
    attachments: [],
    // FIX: Schema uses 'closedBy' to track the creator (User ID)
    closedBy: req.user?.id, 
    assignedTo: null
  };

  // Azure File Upload Logic
  if (req.file) {
    newTicket.attachments.push({
      name: req.file.originalname,
      url: req.file.url || req.file.path, 
      blobName: req.file.blobName 
    });
  }

  const ticket = new Ticket(newTicket);
  
  // Set Defaults
  ticket.status = 'Open'; 
  ticket.priority = 'Medium Priority';
  
  const savedTicket = await ticket.save();

  // --- EMAIL NOTIFICATION LOGIC ---
  // 1. Find all Admins to notify
  const admins = await User.find({ role: 'Admin' });
  const adminEmails = admins.map(admin => admin.email);

  // 2. Add the Ticket Creator + Admins to recipients
  const recipients = [...new Set([emailAddress, ...adminEmails])];

  // 3. Send Email (Fire and forget)
  sendTicketCreationEmail(recipients, savedTicket).catch(console.error);
  // -------------------------------

  res.status(201).json(savedTicket);
});

// --- 2. GET ALL TICKETS (The Global Fetch) ---
exports.getAllTickets = catchAsync(async (req, res) => {
  let query = {};

  // RBAC Logic: 
  // - Admin/Super Admin: See ALL tickets (No filter).
  // - Technician: See Assigned + Created (via RBAC scope).
  // - Employee: See Created Only.
  if (!['Admin', 'Super Admin'].includes(req.user.role)) {
    const rbacFilter = await getSearchScope(req.user, 'ticket');
    
    // Map generic 'user' filter from RBAC to 'closedBy' schema field if present
    if (rbacFilter.user) {
        query.closedBy = rbacFilter.user;
        // If RBAC has other filters (like status), merge them
        const { user, ...rest } = rbacFilter;
        Object.assign(query, rest);
    } else {
        // Direct merge for complex queries (like $or for Technicians)
        // If RBAC returns { $or: [{assignedTo: me}, {user: me}] }
        // We need to ensure 'user' maps to 'closedBy' inside the $or array
        if (rbacFilter.$or) {
           query.$or = rbacFilter.$or.map(condition => {
             if (condition.user) {
               return { closedBy: condition.user };
             }
             return condition;
           });
        } else {
           Object.assign(query, rbacFilter);
        }
    }
  }

  // Fetch with full population
  const tickets = await Ticket.find(query)
    .populate('closedBy', 'name email avatar') // The Creator
    .populate('assignedTo', 'name email avatar') // The Technician
    .sort({ createdAt: -1 });

  res.status(200).json(tickets);
});

// --- 3. GET TICKETS FOR SPECIFIC USER (Legacy/Profile) ---
exports.getUserTickets = catchAsync(async (req, res) => {
  const email = req.query.email;
  const tickets = await Ticket.find({ email })
    .populate('closedBy')
    .populate('assignedTo');
  res.status(200).json(tickets);
});

// --- 4. GET SINGLE TICKET BY ID ---
exports.getTicketById = catchAsync(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('closedBy', 'name email avatar')
    .populate('assignedTo', 'name email avatar');
    
  if (!ticket) throw new NotFoundError("Ticket");
  res.status(200).json(ticket);
});

// --- 5. UPDATE TICKET (General Info) ---
exports.updateTicket = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new NotFoundError("Ticket");

  Object.assign(ticket, updates);
  const updated = await ticket.save();

  res.status(200).json(updated);
});

// --- 6. DELETE TICKET ---
exports.deleteTicket = catchAsync(async (req, res) => {
  const ticket = await Ticket.findByIdAndDelete(req.params.id);
  if (!ticket) throw new NotFoundError("Ticket");

  res.status(200).json({ message: "Ticket deleted successfully" });
});

// --- 7. UPDATE STATUS (Case Insensitive Fix) ---
exports.updateTicketStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Normalize input map
  const statusMap = {
    "opened": "Open",
    "open": "Open",
    "unattended": "Open", 
    "in progress": "In Progress",
    "closed": "Closed"
  };

  const normalizedStatus = statusMap[status.toLowerCase()];

  if (!normalizedStatus) {
    return res.status(400).json({ message: "Invalid status. Use: Open, In Progress, or Closed" });
  }

  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { status: normalizedStatus },
    { new: true }
  );

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  res.status(200).json(ticket);
});

// --- 8. UPDATE PRIORITY ---
exports.updateTicketPriority = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;

  if (!["High Priority", "Medium Priority", "Low Priority", "High", "Medium", "Low"].includes(priority)) {
    return res.status(400).json({ message: "Invalid priority" });
  }
  
  // Normalize if needed (Frontend sends "High", Schema might want "High Priority")
  // Assuming strict schema match or loose string match
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { priority },
    { new: true }
  );

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  res.status(200).json(ticket);
});

// --- 9. ASSIGN TICKET (Technician Assignment) ---
exports.updateTicketAssignee = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  if (!assignedTo || typeof assignedTo !== 'string') {
    return res.status(400).json({ message: "Assigned user ID is required" });
  }

  // Verify Admin/Technician exists
  const admin = await User.findById(assignedTo);
  if (!admin) {
    return res.status(404).json({ message: "User not found" });
  }

  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { assignedTo },
    { new: true }
  ).populate('assignedTo');

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  // Notify the newly assigned person
  sendAssignmentEmail(admin.email, ticket).catch(console.error);

  res.status(200).json(ticket);
});

// --- 10. ADD RESPONSE (Chat System) ---
exports.addTicketResponse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content, avatar } = req.body;

  console.log("Adding response to ticket:", id);

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new NotFoundError("Ticket");

  const newResponse = {
    author: req.user?.name || "Unknown",
    content,
    time: new Date().toISOString(),
    avatar: req.user?.avatar || avatar || ""
  };

  ticket.responses.push(newResponse);
  await ticket.save();

  res.status(200).json(ticket);
});

// --- 11. DOWNLOAD ATTACHMENT (Azure SAS) ---
exports.downloadTicketAttachment = catchAsync(async (req, res) => {
  const { id, attachmentId } = req.params;
  
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new NotFoundError("Ticket");
  
  const attachment = ticket.attachments.id(attachmentId);
  if (!attachment) throw new NotFoundError("Attachment");
  
  try {
    // A. Use BlobName for Secure SAS URL
    if (attachment.blobName) {
      const blockBlobClient = containerClient.getBlockBlobClient(attachment.blobName);
      
      const sasUrl = await blockBlobClient.generateSasUrl({
        permissions: "r", 
        expiresOn: new Date(new Date().valueOf() + 300 * 1000), // 5 minutes
        contentDisposition: `attachment; filename="${attachment.name}"`
      });
      
      return res.redirect(sasUrl);
    } 
    // B. Fallback to direct URL (Legacy)
    else if (attachment.url) {
      return res.redirect(attachment.url);
    } 
    else {
      throw new BadRequestError("No valid attachment URL found");
    }
  } catch (error) {
    console.error("Download error:", error);
    throw new BadRequestError("Failed to generate download link");
  }
});

// =========================================================
// EMAIL HELPERS (Fully Included)
// =========================================================

const sendTicketCreationEmail = async (recipients, ticket) => {
  const subject = `New Ticket Created - #${ticket.ticketID}: ${ticket.subject}`;
  const htmlContent = generateTicketEmailTemplate(ticket);

  console.log(`📨 Sending ticket emails to: ${recipients.join(', ')}`);

  recipients.forEach(email => {
    sendEmail(email, subject, htmlContent)
      .catch(err => console.error(`❌ Failed to send background email to ${email}:`, err.message));
  });
};

const sendAssignmentEmail = async (email, ticket) => {
  const subject = `Ticket #${ticket.ticketID} Assigned to You: ${ticket.subject}`;
  const htmlContent = generateAssignmentEmailTemplate(ticket);

  console.log(`📨 Sending assignment email to ${email}`);
  
  sendEmail(email, subject, htmlContent)
    .catch(err => console.error(`❌ Failed to send assignment email to ${email}:`, err.message));
};

// HTML Template: Ticket Creation
const generateTicketEmailTemplate = (ticket) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>New Ticket Notification</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .email-container { background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background-color: #497a71; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 25px; }
        .ticket-card { background-color: #f5f5f5; border-left: 4px solid #497a71; padding: 15px; margin-bottom: 20px; border-radius: 0 4px 4px 0; }
        .ticket-id { font-size: 18px; font-weight: bold; color: #497a71; margin-bottom: 10px; }
        .ticket-field { margin-bottom: 8px; }
        .ticket-field strong { display: inline-block; width: 100px; color: #666; }
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-opened { background-color: #e0f7e0; color: #2e7d32; }
        .footer { text-align: center; padding: 15px; font-size: 12px; color: #777; border-top: 1px solid #eee; }
        .attachment { display: flex; align-items: center; margin-top: 10px; padding: 8px; background-color: #f0f0f0; border-radius: 4px; }
        .attachment-icon { margin-right: 10px; color: #497a71; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>New Support Ticket Created</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>A new ticket has been created in our system. Here are the details:</p>
          <div class="ticket-card">
            <div class="ticket-id">Ticket #${ticket.ticketID}</div>
            <div class="ticket-field"><strong>Subject:</strong> ${ticket.subject}</div>
            <div class="ticket-field"><strong>Status:</strong> <span class="status-badge status-opened">${ticket.status}</span></div>
            <div class="ticket-field"><strong>Priority:</strong> ${ticket.priority}</div>
            <div class="ticket-field"><strong>Submitted by:</strong> ${ticket.emailAddress}</div>
            <div class="ticket-field"><strong>Description:</strong> ${ticket.description}</div>
            ${ticket.attachments.length > 0 ? `
            <div class="ticket-field">
              <strong>Attachment:</strong>
              <div class="attachment"><span class="attachment-icon">📎</span>${ticket.attachments[0].name}</div>
            </div>` : ''}
          </div>
          <p>Our team will review your ticket and respond as soon as possible.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Abidi Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// HTML Template: Assignment
const generateAssignmentEmailTemplate = (ticket) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Ticket Assignment Notification</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .email-container { background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background-color: #497a71; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 25px; }
        .ticket-card { background-color: #f5f5f5; border-left: 4px solid #497a71; padding: 15px; margin-bottom: 20px; border-radius: 0 4px 4px 0; }
        .ticket-id { font-size: 18px; font-weight: bold; color: #497a71; margin-bottom: 10px; }
        .footer { text-align: center; padding: 15px; font-size: 12px; color: #777; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>New Ticket Assignment</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have been assigned a new support ticket. Please review the details below:</p>
          <div class="ticket-card">
            <div class="ticket-id">Ticket #${ticket.ticketID}</div>
            <p><strong>Subject:</strong> ${ticket.subject}</p>
            <p><strong>Status:</strong> ${ticket.status}</p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            <p><strong>Submitted by:</strong> ${ticket.emailAddress}</p>
            <p><strong>Description:</strong> ${ticket.description}</p>
          </div>
          <p style="margin-top: 20px;">Please address this ticket at your earliest convenience.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Abidi Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};