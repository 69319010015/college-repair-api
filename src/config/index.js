require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  auth: {
    secret: process.env.AUTH_SECRET || 'dev-only-secret-do-not-use-in-production',
    tokenTtlSeconds: Number(process.env.TOKEN_TTL_SECONDS || 3600),
  },
  api: {
    prefix: '/api/v1',
    defaultPageSize: 10,
    maxPageSize: 50,
  },
};

module.exports = config;
