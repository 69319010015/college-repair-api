const ApiError = require('../utils/ApiError');
const ticketRepository = require('../repositories/ticket.repository');
const deviceRepository = require('../repositories/device.repository');
const { ROLES } = require('../domain/roles');
const { canTransition, actorAllowed } = require('../domain/ticketStatus');
const { STATUS } = require('../domain/ticketStatus');

function createTicket(input, user) {
  if (input.deviceId) {
    const device = deviceRepository.findById(input.deviceId);
    if (!device) throw ApiError.badRequest('ไม่พบอุปกรณ์ที่อ้างถึง', [{ path: 'deviceId', message: 'device not found' }]);
  }
  const now = new Date().toISOString();
  const ticket = {
    id: ticketRepository.nextId(),
    ticketNo: ticketRepository.nextTicketNo(),
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority,
    deviceId: input.deviceId || null,
    requesterId: user.id,
    requesterName: user.name,
    assignedTo: null,
    status: STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
    statusHistory: [{ status: STATUS.PENDING, by: user.id, at: now, note: 'แจ้งซ่อม' }],
  };
  return ticketRepository.save(ticket);
}

function listTickets({ status, page, limit, q }, user) {
  const matches = ticketRepository.findAll((t) => {
    const byStatus = status ? t.status === status : true;
    const byOwner = user.role === ROLES.STUDENT ? t.requesterId === user.id : true;
    const byText = q
      ? `${t.title} ${t.description} ${t.ticketNo}`.toLowerCase().includes(q.toLowerCase())
      : true;
    return byStatus && byOwner && byText;
  });
  const total = matches.length;
  const start = (page - 1) * limit;
  return {
    data: matches.slice(start, start + limit),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

function getTicket(id, user) {
  const ticket = ticketRepository.findById(id);
  if (!ticket) throw ApiError.notFound('ไม่พบงานซ่อมนี้');
  if (user.role === ROLES.STUDENT && ticket.requesterId !== user.id) {
    throw ApiError.forbidden('เข้าถึงได้เฉพาะงานซ่อมของตนเอง');
  }
  return ticket;
}

function updateStatus(id, { status: nextStatus, note }, user) {
  const ticket = ticketRepository.findById(id);
  if (!ticket) throw ApiError.notFound('ไม่พบงานซ่อมนี้');

  if (!actorAllowed(nextStatus, user.role)) {
    throw ApiError.forbidden(`บทบาท ${user.role} ไม่มีสิทธิ์ตั้งสถานะ ${nextStatus}`);
  }
  if (nextStatus === STATUS.CANCELED && user.role === ROLES.STUDENT) {
    if (ticket.requesterId !== user.id) throw ApiError.forbidden('ยกเลิกได้เฉพาะงานซ่อมของตนเอง');
    if (ticket.status !== STATUS.PENDING) {
      throw ApiError.conflict('INVALID_STATE', 'ยกเลิกได้เฉพาะงานที่ยังไม่ถูกรับเรื่อง');
    }
  }
  if (!canTransition(ticket.status, nextStatus)) {
    throw ApiError.conflict(
      'INVALID_STATE',
      `เปลี่ยนสถานะจาก ${ticket.status} เป็น ${nextStatus} ไม่ได้`
    );
  }

  const now = new Date().toISOString();
  ticket.status = nextStatus;
  ticket.updatedAt = now;
  if (nextStatus === STATUS.ACCEPTED) ticket.assignedTo = user.id;
  ticket.statusHistory.push({ status: nextStatus, by: user.id, role: user.role, at: now, note: note || null });
  return ticketRepository.save(ticket);
}

module.exports = { createTicket, listTickets, getTicket, updateStatus };
