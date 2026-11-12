const ApiError = require('../utils/ApiError');
const { sign } = require('../utils/token');
const { ROLES } = require('../domain/roles');

/**
 * เดโมการยืนยันตัวตนสำหรับโครงงานสัปดาห์นี้:
 * รับ studentId + role แล้วออก token (ยังไม่ตรวจรหัสผ่าน/ไม่ต่อ LDAP ของวิทยาลัย)
 * TODO(สัปดาห์ถัดไป): ตรวจรหัสผ่านจากตาราง users + จำกัดการขอ role ADMIN
 */
function login({ studentId, fullName, role }) {
  if (role === ROLES.ADMIN && process.env.NODE_ENV === 'production') {
    throw ApiError.forbidden('ไม่อนุญาตให้ขอสิทธิ์ ADMIN ผ่าน endpoint นี้');
  }
  const token = sign({ sub: studentId, name: fullName, role });
  return {
    token,
    tokenType: 'Bearer',
    user: { id: studentId, name: fullName, role },
  };
}

module.exports = { login };
