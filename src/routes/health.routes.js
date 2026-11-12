const router = require('express').Router();
const pkg = require('../../package.json');

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: pkg.name,
    version: pkg.version,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
