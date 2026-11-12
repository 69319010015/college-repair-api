const router = require('express').Router();
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { createDeviceSchema } = require('../schemas/device.schema');
const { ROLES } = require('../domain/roles');
const controller = require('../controllers/device.controller');

router.get('/', authenticate, controller.list);
router.get('/:id', authenticate, controller.detail);
router.post('/', authenticate, requireRole(ROLES.ADMIN), validate({ body: createDeviceSchema }), controller.create);

module.exports = router;
