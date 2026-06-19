const ticketService = require("../services/ticketService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.createTicket = catchAsync(async (req, res) => {
  const ticket = await ticketService.createTicket(req.user, req.companyId, req.body, req.files);
  res.status(201).json(ApiResponse.success(ticket, "Ticket created successfully"));
});

exports.getAllTickets = catchAsync(async (req, res) => {
  const tickets = await ticketService.getAllTickets(req.user, req.companyId);
  res.status(200).json(ApiResponse.success(tickets));
});

exports.getMyTickets = catchAsync(async (req, res) => {
  const data = await ticketService.getMyTickets(req.user.id || req.user._id, req.companyId, req.query.page, req.query.limit);
  res.status(200).json(ApiResponse.success(data.tickets, "My tickets retrieved", data.pagination));
});

exports.getTicketById = catchAsync(async (req, res) => {
  const ticket = await ticketService.getTicketById(req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(ticket));
});

exports.updateTicket = catchAsync(async (req, res) => {
  const updated = await ticketService.updateTicket(req.companyId, req.params.id, req.body);
  res.status(200).json(ApiResponse.success(updated, "Ticket updated"));
});

exports.deleteTicket = catchAsync(async (req, res) => {
  await ticketService.deleteTicket(req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(null, "Ticket deleted successfully"));
});

exports.updateTicketStatus = catchAsync(async (req, res) => {
  const ticket = await ticketService.updateTicketStatus(req.user, req.companyId, req.params.id, req.body.status);
  res.status(200).json(ApiResponse.success(ticket, `Ticket status updated to ${ticket.status}`));
});

exports.updateTicketPriority = catchAsync(async (req, res) => {
  const ticket = await ticketService.updateTicketPriority(req.companyId, req.params.id, req.body.priority);
  res.status(200).json(ApiResponse.success(ticket, `Ticket priority updated to ${ticket.priority}`));
});

exports.updateTicketAssignee = catchAsync(async (req, res) => {
  const ticket = await ticketService.updateTicketAssignee(req.user, req.companyId, req.params.id, req.body.assignedTo);
  res.status(200).json(ApiResponse.success(ticket, "Ticket assigned successfully"));
});

exports.addTicketResponse = catchAsync(async (req, res) => {
  const ticket = await ticketService.addTicketResponse(req.user, req.companyId, req.params.id, req.body);
  res.status(200).json(ApiResponse.success(ticket, "Response added to ticket"));
});

exports.downloadTicketAttachment = catchAsync(async (req, res) => {
  const url = await ticketService.downloadTicketAttachment(req.companyId, req.params.id, req.params.attachmentId);
  return res.redirect(url);
});
