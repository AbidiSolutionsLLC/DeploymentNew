const ticketService = require('../../../services/ticketService');
const Ticket = require('../../../models/ticketManagementSchema');
const mongoose = require('mongoose');
const { ForbiddenError } = require('../../../utils/ExpressError');

describe('TicketService Authorization (IDOR/BOLA Protection)', () => {
  const companyId = new mongoose.Types.ObjectId();
  const creatorId = new mongoose.Types.ObjectId();
  const otherUserId = new mongoose.Types.ObjectId();
  
  let ticketId;

  beforeEach(async () => {
    // Create a mock ticket in the in-memory db
    const ticket = await Ticket.create({
      title: 'Test Ticket',
      description: 'Test Desc',
      company: companyId,
      closedBy: creatorId,
      priority: 'High Priority'
    });
    ticketId = ticket._id;
  });

  it('should allow the creator to delete the ticket', async () => {
    const creatorUser = { _id: creatorId, role: 'Employee', isTechnician: false };
    // Should not throw ForbiddenError
    await expect(ticketService.deleteTicket(creatorUser, companyId, ticketId)).resolves.not.toThrow();
  });

  it('should block an unrelated employee from deleting the ticket', async () => {
    const unrelatedUser = { _id: otherUserId, role: 'Employee', isTechnician: false };
    
    // Should throw ForbiddenError
    await expect(ticketService.deleteTicket(unrelatedUser, companyId, ticketId))
      .rejects.toThrow(ForbiddenError);
  });

  it('should allow an Admin to delete the ticket', async () => {
    const adminUser = { _id: otherUserId, role: 'Admin', isTechnician: false };
    // Should not throw ForbiddenError
    await expect(ticketService.deleteTicket(adminUser, companyId, ticketId)).resolves.not.toThrow();
  });
});
