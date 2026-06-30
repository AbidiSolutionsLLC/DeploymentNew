const Ticket = require("../models/ticketManagementSchema");
const User = require("../models/userSchema");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../utils/ExpressError");
const { containerClient } = require("../config/azureConfig");
const { getSearchScope } = require("../utils/rbac");
const sendEmail = require('../utils/emailService');
const { createNotification } = require('../utils/notificationService');

class TicketService {
  async createTicket(user, companyId, data, files) {
    const { emailAddress, subject, description } = data;

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const ticketID = `TKT-${timestamp}-${random}`;

    const newTicket = {
      emailAddress,
      subject,
      description,
      ticketID,
      company: companyId,
      attachments: [],
      closedBy: user?.id,
      assignedTo: null
    };

    if (files && files.length > 0) {
      files.forEach(file => {
        newTicket.attachments.push({
          name: file.originalname,
          url: file.url || file.path,
          blobName: file.blobName
        });
      });
    }

    const ticket = new Ticket(newTicket);
    ticket.status = 'Open';
    ticket.priority = 'Medium Priority';

    const savedTicket = await ticket.save();

    const admins = await User.find({
      $or: [
        { role: 'Admin' },
        { role: 'Super Admin' },
        { role: 'Manager', isTechnician: true }
      ],
      company: companyId
    });

    const adminEmails = admins.map(admin => admin.email);
    const recipients = [...new Set([emailAddress, ...adminEmails])];

    this.sendTicketCreationEmail(recipients, savedTicket).catch(console.error);

    admins.forEach(admin => {
      createNotification({
        recipient: admin._id,
        type: 'TICKET_CREATED',
        title: 'New Support Ticket',
        message: `A new ${savedTicket.priority} priority support ticket has been created: "${savedTicket.subject}".`,
        relatedEntity: { entityType: 'ticket', entityId: savedTicket._id },
      }).catch(console.error);
    });

    return savedTicket;
  }

  async getAllTickets(user, companyId) {
    let query = { company: companyId };

    const isSuperAdmin = user.role === 'Super Admin';
    const isAdmin = user.role === 'Admin';
    const isManager = user.role === 'Manager';
    const isTechnician = user.isTechnician === true;

    const hasFullAccess = isSuperAdmin || isAdmin || (isManager && isTechnician);

    if (!hasFullAccess) {
      const rbacFilter = await getSearchScope(user, 'ticket');
      
      if (rbacFilter.user) {
          query.closedBy = rbacFilter.user;
          const { user: userFilter, ...rest } = rbacFilter;
          Object.assign(query, rest);
      } else {
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

    return Ticket.find(query)
      .populate('closedBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  async getMyTickets(userId, companyId, pageQuery, limitQuery) {
    const page = parseInt(pageQuery) || 1;
    const limit = parseInt(limitQuery) || 10;
    const skip = (page - 1) * limit;

    const tickets = await Ticket.find({ closedBy: userId, company: companyId })
      .populate('closedBy')
      .populate('assignedTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Ticket.countDocuments({ closedBy: userId, company: companyId });

    return { tickets, pagination: { total, page, limit } };
  }

  async getTicketById(companyId, ticketId) {
    const ticket = await Ticket.findOne({ _id: ticketId, company: companyId })
      .populate('closedBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar');
      
    if (!ticket) throw new NotFoundError("Ticket");
    return ticket;
  }

  async updateTicket(companyId, ticketId, updates) {
    const ticket = await Ticket.findOne({ _id: ticketId, company: companyId });
    if (!ticket) throw new NotFoundError("Ticket");

    Object.assign(ticket, updates);
    return ticket.save();
  }

  async deleteTicket(companyId, ticketId) {
    const ticket = await Ticket.findOne({ _id: ticketId, company: companyId });
    if (!ticket) throw new NotFoundError("Ticket");

    if (ticket.closedBy) {
      createNotification({
        recipient: ticket.closedBy,
        type: 'TICKET_DELETED',
        title: 'Support Ticket Deleted',
        message: `Support ticket "${ticket.subject}" has been deleted.`,
        relatedEntity: { entityType: 'ticket', entityId: ticket._id },
      }).catch(console.error);
    }

    await ticket.deleteOne();
  }

  async updateTicketStatus(user, companyId, ticketId, status) {
    const statusMap = {
      "opened": "Open",
      "open": "Open",
      "unattended": "Open",
      "in progress": "In Progress",
      "closed": "Closed"
    };

    const normalizedStatus = statusMap[status.toLowerCase()];
    if (!normalizedStatus) {
      throw new BadRequestError("Invalid status. Use: Open, In Progress, or Closed");
    }

    const ticket = await Ticket.findOne({ _id: ticketId, company: companyId }).populate('closedBy', '_id');
    if (!ticket) throw new NotFoundError("Ticket not found");

    const currentUserId = (user.id || user._id).toString();
    // Allow users to update their own ticket status (e.g. marking it as Closed when resolved)
    // Removed the restriction that prevented ticket creators from updating status

    ticket.status = normalizedStatus;
    await ticket.save();

    try {
      if (ticket.closedBy && ticket.closedBy._id) {
        const type = normalizedStatus === 'Closed' ? 'TICKET_CLOSED' : 'TICKET_STATUS_CHANGED';
        const title = normalizedStatus === 'Closed' ? 'Ticket Closed' : 'Ticket Status Updated';
        const message = normalizedStatus === 'Closed' 
          ? `Your ticket "${ticket.subject}" has been closed.` 
          : `Your support ticket "${ticket.subject}" is now "${normalizedStatus}".`;

        await createNotification({
          recipient: ticket.closedBy._id,
          type: type,
          title: title,
          message: message,
          relatedEntity: { entityType: 'ticket', entityId: ticket._id },
        });
      }
    } catch (notifErr) {
      console.error('[Notification] Ticket status change:', notifErr.message);
    }

    return ticket;
  }

  async updateTicketPriority(companyId, ticketId, priority) {
    if (!["High Priority", "Medium Priority", "Low Priority", "High", "Medium", "Low"].includes(priority)) {
      throw new BadRequestError("Invalid priority");
    }

    const ticket = await Ticket.findOneAndUpdate(
      { _id: ticketId, company: companyId },
      { priority },
      { new: true }
    );

    if (!ticket) throw new NotFoundError("Ticket not found");
    return ticket;
  }

  async updateTicketAssignee(user, companyId, ticketId, assignedTo) {
    const actor = await User.findById(user.id || user._id);
    if (!actor) throw new ForbiddenError("User not found.");

    const isSuperAdmin = actor.role === 'Super Admin';
    const isAdmin = actor.role === 'Admin';
    const isManagerTech = actor.role === 'Manager' && actor.isTechnician;

    if (!isSuperAdmin && !isAdmin && !isManagerTech) {
      throw new ForbiddenError("Permission denied. You cannot assign tickets.");
    }

    if (!assignedTo || typeof assignedTo !== 'string') {
      throw new BadRequestError("Assigned user ID is required");
    }

    const userToAssign = await User.findById(assignedTo);
    if (!userToAssign) throw new NotFoundError("User not found");

    const ticket = await Ticket.findOne({ _id: ticketId, company: companyId });
    if (!ticket) throw new NotFoundError("Ticket not found");

    const currentUserId = (user.id || user._id).toString();
    // Allow users to assign tickets they created
    // Removed the restriction that prevented assigning own tickets

    const ticketUpdated = await Ticket.findOneAndUpdate(
      { _id: ticketId, company: companyId },
      { assignedTo },
      { new: true }
    ).populate('assignedTo');

    this.sendAssignmentEmail(userToAssign.email, ticketUpdated).catch(console.error);

    try {
      await createNotification({
        recipient: userToAssign._id,
        type: 'TICKET_ASSIGNED',
        title: 'Ticket Assigned to You',
        message: `A support ticket "${ticketUpdated.subject}" (Priority: ${ticketUpdated.priority}) has been assigned to you.`,
        relatedEntity: { entityType: 'ticket', entityId: ticketUpdated._id },
      });
    } catch (notifErr) {
      console.error('[Notification] Ticket assigned:', notifErr.message);
    }

    return ticketUpdated;
  }

  async addTicketResponse(user, companyId, ticketId, data) {
    const { content, avatar } = data;

    const ticket = await Ticket.findOne({ _id: ticketId, company: companyId });
    if (!ticket) throw new NotFoundError("Ticket");

    const newResponse = {
      author: user?.name || "Unknown",
      content,
      time: new Date().toISOString(),
      avatar: user?.avatar || avatar || ""
    };

    ticket.responses.push(newResponse);
    await ticket.save();

    try {
      if (ticket.closedBy) {
        const authorName = user?.name || 'A technician';
        await createNotification({
          recipient: ticket.closedBy,
          type: 'TICKET_RESPONSE_ADDED',
          title: 'New Response on Your Ticket',
          message: `${authorName} added a response to your ticket: "${ticket.subject}".`,
          relatedEntity: { entityType: 'ticket', entityId: ticket._id },
        });
      }
    } catch (notifErr) {
      console.error('[Notification] Ticket response:', notifErr.message);
    }

    return ticket;
  }

  async downloadTicketAttachment(companyId, ticketId, attachmentId) {
    const ticket = await Ticket.findOne({ _id: ticketId, company: companyId });
    if (!ticket) throw new NotFoundError("Ticket");

    const attachment = ticket.attachments.id(attachmentId);
    if (!attachment) throw new NotFoundError("Attachment");

    try {
      if (attachment.blobName) {
        const blockBlobClient = containerClient.getBlockBlobClient(attachment.blobName);
        const sasUrl = await blockBlobClient.generateSasUrl({
          permissions: "r",
          expiresOn: new Date(new Date().valueOf() + 300 * 1000),
          contentDisposition: `attachment; filename="${attachment.name}"`
        });
        return sasUrl;
      } else if (attachment.url) {
        return attachment.url;
      } else {
        throw new BadRequestError("No valid attachment URL found");
      }
    } catch (error) {
      console.error("Download error:", error);
      throw new BadRequestError("Failed to generate download link");
    }
  }

  // =========================================================
  // EMAIL HELPERS
  // =========================================================

  async sendTicketCreationEmail(recipients, ticket) {
    const subject = `New Ticket Created - #${ticket.ticketID}: ${ticket.subject}`;
    const htmlContent = this.generateTicketEmailTemplate(ticket);
    recipients.forEach(email => {
      sendEmail(email, subject, htmlContent)
        .catch(err => console.error(`❌ Failed to send background email to ${email}:`, err.message));
    });
  }

  async sendAssignmentEmail(email, ticket) {
    const subject = `Ticket #${ticket.ticketID} Assigned to You: ${ticket.subject}`;
    const htmlContent = this.generateAssignmentEmailTemplate(ticket);
    sendEmail(email, subject, htmlContent)
      .catch(err => console.error(`❌ Failed to send assignment email to ${email}:`, err.message));
  }

  generateTicketEmailTemplate(ticket) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>New Ticket Notification</title>
      </head>
      <body>
        <div>
          <h1>New Support Ticket Created</h1>
          <p>A new ticket has been created in our system. Here are the details:</p>
          <p><strong>Ticket ID:</strong> #${ticket.ticketID}</p>
          <p><strong>Subject:</strong> ${ticket.subject}</p>
          <p><strong>Status:</strong> ${ticket.status}</p>
          <p><strong>Priority:</strong> ${ticket.priority}</p>
        </div>
      </body>
      </html>
    `;
  }

  generateAssignmentEmailTemplate(ticket) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Ticket Assignment Notification</title>
      </head>
      <body>
        <div>
          <h1>New Ticket Assignment</h1>
          <p>You have been assigned a new support ticket. Please review the details below:</p>
          <p><strong>Ticket ID:</strong> #${ticket.ticketID}</p>
          <p><strong>Subject:</strong> ${ticket.subject}</p>
          <p><strong>Status:</strong> ${ticket.status}</p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new TicketService();
