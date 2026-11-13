const { ROLES } = require('./roles');

/**
 * สถานะงานซ่อม
 *
 * 4 สถานะหลักตามข้อกำหนดของระบบ (ใบสถานการณ์จำลอง):
 *   PENDING     = รอดำเนินการ
 *   IN_PROGRESS = กำลังซ่อม
 *   WAITING_PARTS = รออะไหล่
 *   COMPLETED   = ซ่อมเสร็จ
 *
 * สถานะเสริมที่ระบบใช้กำกับขั้นตอนการทำงาน (ไม่นับใน 4 สถานะหลัก):
 *   ACCEPTED = ช่างรับเรื่องแล้ว (ยังไม่เริ่มซ่อม)   CLOSED = หัวหน้างานปิดงาน
 *   REJECTED = ซ่อมไม่ได้ / ไม่รับงาน               CANCELED = ผู้แจ้งยกเลิกก่อนช่างรับเรื่อง
 */
const STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_PARTS: 'WAITING_PARTS',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
  CANCELED: 'CANCELED',
});

/** ชื่อไทยของสถานะ ใช้ตอบ API ให้ฝั่งหน้าจอแสดงผลได้เลย */
const STATUS_LABEL = Object.freeze({
  [STATUS.PENDING]: 'รอดำเนินการ',
  [STATUS.ACCEPTED]: 'ช่างรับเรื่องแล้ว',
  [STATUS.IN_PROGRESS]: 'กำลังซ่อม',
  [STATUS.WAITING_PARTS]: 'รออะไหล่',
  [STATUS.COMPLETED]: 'ซ่อมเสร็จ',
  [STATUS.CLOSED]: 'ปิดงาน',
  [STATUS.REJECTED]: 'ซ่อมไม่ได้',
  [STATUS.CANCELED]: 'ยกเลิก',
});

/** state machine ของงานซ่อม: สถานะใดไปต่อสถานะใดได้บ้าง */
const TRANSITIONS = Object.freeze({
  [STATUS.PENDING]: [STATUS.ACCEPTED, STATUS.REJECTED, STATUS.CANCELED],
  [STATUS.ACCEPTED]: [STATUS.IN_PROGRESS, STATUS.CANCELED],
  [STATUS.IN_PROGRESS]: [STATUS.WAITING_PARTS, STATUS.COMPLETED],
  [STATUS.WAITING_PARTS]: [STATUS.IN_PROGRESS, STATUS.COMPLETED],
  [STATUS.COMPLETED]: [STATUS.CLOSED],
  [STATUS.CLOSED]: [],
  [STATUS.REJECTED]: [],
  [STATUS.CANCELED]: [],
});

/** ใครมีสิทธิ์เปลี่ยนสถานะเป็นอะไร */
const STATUS_ACTORS = Object.freeze({
  [STATUS.ACCEPTED]: [ROLES.TECHNICIAN, ROLES.ADMIN],
  [STATUS.REJECTED]: [ROLES.TECHNICIAN, ROLES.ADMIN],
  [STATUS.IN_PROGRESS]: [ROLES.TECHNICIAN, ROLES.ADMIN],
  [STATUS.WAITING_PARTS]: [ROLES.TECHNICIAN, ROLES.ADMIN],
  [STATUS.COMPLETED]: [ROLES.TECHNICIAN, ROLES.ADMIN],
  [STATUS.CLOSED]: [ROLES.ADMIN],
  [STATUS.CANCELED]: [ROLES.STUDENT, ROLES.ADMIN],
});

function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

function actorAllowed(to, role) {
  return (STATUS_ACTORS[to] || []).includes(role);
}

function labelOf(status) {
  return STATUS_LABEL[status] || status;
}

module.exports = { STATUS, STATUS_LABEL, TRANSITIONS, STATUS_ACTORS, canTransition, actorAllowed, labelOf };
