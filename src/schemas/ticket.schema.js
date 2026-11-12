const { z } = require('zod');
const { STATUS } = require('../domain/ticketStatus');

const createTicketSchema = z.object({
  title: z.string().trim().min(5, 'หัวข้อต้องยาวอย่างน้อย 5 ตัวอักษร').max(120),
  description: z.string().trim().min(10, 'รายละเอียดต้องยาวอย่างน้อย 10 ตัวอักษร').max(2000),
  category: z.enum(['COMPUTER', 'PRINTER', 'NETWORK', 'PROJECTOR', 'OTHER']),
  deviceId: z.string().trim().min(1).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
});

const listTicketsQuerySchema = z.object({
  status: z.nativeEnum(STATUS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  q: z.string().trim().max(120).optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(STATUS),
  note: z.string().trim().max(500).optional(),
});

module.exports = { createTicketSchema, listTicketsQuerySchema, updateStatusSchema };
