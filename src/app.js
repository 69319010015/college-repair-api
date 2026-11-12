const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const pkg = require('../package.json');

/**
 * แยก app (การประกอบ middleware + route) ออกจาก server (การ listen)
 * เพื่อให้ test ยิง supertest(app) ได้โดยไม่ต้องเปิด port จริง
 */
function createApp({ logging = config.env !== 'test' } = {}) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  if (logging) app.use(morgan('dev'));

  app.get('/', (req, res) => {
    res.json({
      service: pkg.name,
      version: pkg.version,
      description: pkg.description,
      endpoints: ['/api/v1/health', '/api/v1/auth/login', '/api/v1/tickets', '/api/v1/devices'],
    });
  });

  app.use(config.api.prefix, routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
