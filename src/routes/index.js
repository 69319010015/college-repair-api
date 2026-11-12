const router = require('express').Router();

router.use('/health', require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/tickets', require('./ticket.routes'));
router.use('/devices', require('./device.routes'));

module.exports = router;
