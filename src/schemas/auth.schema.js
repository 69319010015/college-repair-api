const { z } = require('zod');
const { ROLES } = require('../domain/roles');

const loginSchema = z.object({
  studentId: z.string().trim().min(3, 'studentId สั้นเกินไป').max(20),
  fullName: z.string().trim().min(2).max(120).default('ผู้ใช้งานทดสอบ'),
  role: z.nativeEnum(ROLES).default(ROLES.STUDENT),
});

module.exports = { loginSchema };
