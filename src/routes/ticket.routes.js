const router = require('express').Router();
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { createTicketSchema, listTicketsQuerySchema, updateStatusSchema } = require('../schemas/ticket.schema');
const { ROLES } = require('../domain/roles');
const controller = require('../controllers/ticket.controller');

router.use(authenticate);

router.get('/', validate({ query: listTicketsQuerySchema }), controller.list);
router.post(
  '/',
  requireRole(ROLES.STUDENT, ROLES.ADMIN),
  validate({ body: createTicketSchema }),
  controller.create
);
router.get('/:id', controller.detail);
router.patch(
  '/:id/status',
  requireRole(ROLES.TECHNICIAN, ROLES.ADMIN, ROLES.STUDENT),
  validate({ body: updateStatusSchema }),
  controller.updateStatus
);

module.exports = router;
