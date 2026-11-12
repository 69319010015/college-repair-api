const { ROLES } = require('./roles');

const STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
  CANCELED: 'CANCELED',
});

/** state machine ของงานซ่อม: สถานะใดไปต่อสถานะใดได้บ้าง */
const TRANSITIONS = Object.freeze({
  [STATUS.PENDING]: [STATUS.ACCEPTED, STATUS.REJECTED, STATUS.CANCELED],
  [STATUS.ACCEPTED]: [STATUS.IN_PROGRESS, STATUS.CANCELED],
  [STATUS.IN_PROGRESS]: [STATUS.COMPLETED],
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

module.exports = { STATUS, TRANSITIONS, STATUS_ACTORS, canTransition, actorAllowed };
