const ticketService = require('../services/ticket.service');

function create(req, res, next) {
  try {
    res.status(201).json({ data: ticketService.createTicket(req.body, req.user) });
  } catch (error) {
    next(error);
  }
}

function list(req, res, next) {
  try {
    res.json(ticketService.listTickets(req.validatedQuery, req.user));
  } catch (error) {
    next(error);
  }
}

function detail(req, res, next) {
  try {
    res.json({ data: ticketService.getTicket(req.params.id, req.user) });
  } catch (error) {
    next(error);
  }
}

function updateStatus(req, res, next) {
  try {
    res.json({ data: ticketService.updateStatus(req.params.id, req.body, req.user) });
  } catch (error) {
    next(error);
  }
}

module.exports = { create, list, detail, updateStatus };
