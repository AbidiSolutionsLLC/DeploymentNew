const Ticket = require("../models/ticketManagementSchema");
const User = require("../models/userSchema");
const catchAsync = require("../utils/catchAsync");
const { NotFoundError } = require("../utils/ExpressError");
const nodemailer = require("nodemailer");
const { containerClient, containerName } = require("../config/azureConfig");const axios = require("axios");
const sendEmail = require('../utils/emailService');
const { BadRequestError } = require("../utils/ExpressError");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

// Create Ticket
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
    closedBy: req.user?.id || undefined
  };

if (req.file) {
    newTicket.attachments.push({
      name: req.file.originalname,
      url: req.file.url || req.file.path, // Azure URL
      blobName: req.file.blobName // Store this for secure downloads
    });
  }

  const ticket = new Ticket(newTicket);
  console.log("Creating ticket:", ticket);
  ticket.status = 'opened';
  ticket.priority = 'Medium Priority';
  const savedTicket = await ticket.save();

  const admins = await User.find({ role: 'Admin' });
  const adminEmails = admins.map(admin => admin.email);

  const recipients = [...new Set([emailAddress, ...adminEmails])];

  await sendTicketCreationEmail(recipients, savedTicket);

  res.status(201).json(savedTicket);
});

// exports.createTicket = async (req, res, next) => {


//   try {
 

//     const email = "tsaleem@abidisolutions.com" 

//       const emailSubject = "Welcome to Abidi Solutions!";


//   const emailBody = `
//     <h1>Welcome, ${email}!</h1>
//     <p>Your account has been successfully created.</p>
//     <p>Click <a href="https://abidipro.abidisolutions.com">here</a> to login.</p>
//     `;


//     await sendEmail(email, emailSubject, emailBody);
 
//     // 3. ONLY send response after everything worked
//     return res.status(200).json({ message: "Ticket created and email sent" });
 
//   } catch (error) {
//     // 4. If anything above failed, this sends the ONE and ONLY error response
//     next(error); 
//   }
// };


const sendTicketCreationEmail = async (recipients, ticket) => {
  const mailOptions = {
    from: `"Support Team" <${process.env.GMAIL}>`,
    to: recipients.join(', '),
    subject: `New Ticket Created - #${ticket.ticketID}: ${ticket.subject}`,
    html: generateTicketEmailTemplate(ticket),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Ticket creation emails sent successfully');
  } catch (error) {
    console.error('Error sending ticket creation emails:', error);
  }
};

const generateTicketEmailTemplate = (ticket) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Ticket Notification</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .email-container {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background-color: #497a71;
          color: white;
          padding: 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 25px;
        }
        .ticket-card {
          background-color: #f5f5f5;
          border-left: 4px solid #497a71;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 0 4px 4px 0;
        }
        .ticket-id {
          font-size: 18px;
          font-weight: bold;
          color: #497a71;
          margin-bottom: 10px;
        }
        .ticket-field {
          margin-bottom: 8px;
        }
        .ticket-field strong {
          display: inline-block;
          width: 100px;
          color: #666;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-opened {
          background-color: #e0f7e0;
          color: #2e7d32;
        }
        .footer {
          text-align: center;
          padding: 15px;
          font-size: 12px;
          color: #777;
          border-top: 1px solid #eee;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #497a71;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 15px;
        }
        .attachment {
          display: flex;
          align-items: center;
          margin-top: 10px;
          padding: 8px;
          background-color: #f0f0f0;
          border-radius: 4px;
        }
        .attachment-icon {
          margin-right: 10px;
          color: #497a71;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>New Support Ticket Created</h1>
        </div>
        
        <div class="content">
          <p>Hello,</p>
          <p>A new  ticket has been created in our system. Here are the details:</p>
          
          <div class="ticket-card">
            <div class="ticket-id">Ticket #${ticket.ticketID}</div>
            
            <div class="ticket-field">
              <strong>Subject:</strong>
              ${ticket.subject}
            </div>
            
            <div class="ticket-field">
              <strong>Status:</strong>
              <span class="status-badge status-opened">${ticket.status}</span>
            </div>
            
            <div class="ticket-field">
              <strong>Priority:</strong>
              ${ticket.priority}
            </div>
            
            <div class="ticket-field">
              <strong>Submitted by:</strong>
              ${ticket.emailAddress}
            </div>
            
            <div class="ticket-field">
              <strong>Description:</strong>
              ${ticket.description}
            </div>
            
            ${ticket.attachments.length > 0 ? `
            <div class="ticket-field">
              <strong>Attachment:</strong>
              <div class="attachment">
                <span class="attachment-icon">📎</span>
                ${ticket.attachments[0].name}
              </div>
            </div>
            ` : ''}
          </div>
          
          <p>Our team will review your ticket and respond as soon as possible. You can view the ticket details by clicking the button below:</p>
                    
          <p style="margin-top: 20px;">Thank you for reaching out to our support team.</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Abidi Pro. All rights reserved.</p>
          <p>This is an automated message, please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};


// Get All Tickets
exports.getAllTickets = catchAsync(async (req, res) => {
  const tickets = await Ticket.find().populate('closedBy').populate('assignedTo');
  res.status(200).json(tickets);
});

//Get all tickets of logged in user
exports.getUserTickets = catchAsync(async (req, res) => {
  const email = req.query.email

  const tickets = await Ticket.find({ email }).populate('closedBy').populate('assignedTo');
  res.status(200).json(tickets);
});


// Get Ticket by ID
exports.getTicketById = catchAsync(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate('closedBy').populate('assignedTo');
  if (!ticket) throw new NotFoundError("Ticket");
  res.status(200).json(ticket);
});

// Update Ticket
exports.updateTicket = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new NotFoundError("Ticket");

  Object.assign(ticket, updates);
  const updated = await ticket.save();

  res.status(200).json(updated);
});

// Delete Ticket
exports.deleteTicket = catchAsync(async (req, res) => {
  const ticket = await Ticket.findByIdAndDelete(req.params.id);
  if (!ticket) throw new NotFoundError("Ticket");

  res.status(200).json({ message: "Ticket deleted successfully" });
});


// PATCH /tickets/:id/status
exports.updateTicketStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["opened", "in progress", "closed"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  res.status(200).json(ticket);
});


// PATCH /tickets/:id/priority
exports.updateTicketPriority = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;

  if (!["High Priority", "Medium Priority", "Low Priority"].includes(priority)) {
    return res.status(400).json({ message: "Invalid priority" });
  }

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


exports.updateTicketAssignee = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  if (!assignedTo || typeof assignedTo !== 'string') {
    return res.status(400).json({ message: "Assigned user ID is required and must be a string" });
  }

  // Find the admin being assigned
  const admin = await User.findById(assignedTo);
  if (!admin) {
    return res.status(404).json({ message: "Admin user not found" });
  }

  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { assignedTo },
    { new: true }
  ).populate('assignedTo');

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  // Send assignment notification email
  await sendAssignmentEmail(admin.email, ticket);

  res.status(200).json(ticket);
});

const sendAssignmentEmail = async (email, ticket) => {
  const mailOptions = {
    from: `"Support Team" <${process.env.GMAIL}>`,
    to: email,
    subject: `Ticket #${ticket.ticketID} Assigned to You: ${ticket.subject}`,
    html: generateAssignmentEmailTemplate(ticket),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Assignment email sent successfully');
  } catch (error) {
    console.error('Error sending assignment email:', error);
  }
};

const generateAssignmentEmailTemplate = (ticket) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Assignment Notification</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .email-container {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background-color: #497a71;
          color: white;
          padding: 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 25px;
        }
        .ticket-card {
          background-color: #f5f5f5;
          border-left: 4px solid #497a71;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 0 4px 4px 0;
        }
        .ticket-id {
          font-size: 18px;
          font-weight: bold;
          color: #497a71;
          margin-bottom: 10px;
        }
        .ticket-field {
          margin-bottom: 8px;
        }
        .ticket-field strong {
          display: inline-block;
          width: 100px;
          color: #666;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-opened {
          background-color: #e0f7e0;
          color: #2e7d32;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #497a71;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 15px;
        }
        .footer {
          text-align: center;
          padding: 15px;
          font-size: 12px;
          color: #777;
          border-top: 1px solid #eee;
        }
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
            
            <div class="ticket-field">
              <strong>Subject:</strong>
              ${ticket.subject}
            </div>
            
            <div class="ticket-field">
              <strong>Status:</strong>
              <span class="status-badge status-opened">${ticket.status}</span>
            </div>
            
            <div class="ticket-field">
              <strong>Priority:</strong>
              ${ticket.priority}
            </div>
            
            <div class="ticket-field">
              <strong>Submitted by:</strong>
              ${ticket.emailAddress}
            </div>
            
            <div class="ticket-field">
              <strong>Description:</strong>
              ${ticket.description}
            </div>
          </div>
          
          <p style="margin-top: 20px;">Please address this ticket at your earliest convenience.</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Abidi Pro. All rights reserved.</p>
          <p>This is an automated message, please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};


exports.addTicketResponse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content, avatar } = req.body;

  console.log("Adding response to ticket:", id, "Content:", content, "Avatar:", avatar);

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new NotFoundError("Ticket");

  console.log(req.user, "User making the response:", req.user);

  const newResponse = {
    author: req.user?.name || "Unknown",
    content,
    time: new Date().toISOString(),
    avatar
  };

  ticket.responses.push(newResponse);
  await ticket.save();

  res.status(200).json(ticket);
});


exports.downloadTicketAttachment = catchAsync(async (req, res) => {
  const { id, attachmentId } = req.params;
  
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new NotFoundError("Ticket");
  
  const attachment = ticket.attachments.id(attachmentId);
  if (!attachment) throw new NotFoundError("Attachment");
  
  try {
    // 1. Try to use blobName to generate a secure SAS URL
    if (attachment.blobName) {
      const blockBlobClient = containerClient.getBlockBlobClient(attachment.blobName);
      
      // Generate SAS URL (valid for 5 mins)
      const sasUrl = await blockBlobClient.generateSasUrl({
        permissions: "r", // Read permission
        expiresOn: new Date(new Date().valueOf() + 300 * 1000), 
        contentDisposition: `attachment; filename="${attachment.name}"`
      });
      
      return res.redirect(sasUrl);
    } 
    // 2. Fallback: If no blobName (legacy files), try direct URL
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
