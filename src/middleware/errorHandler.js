const config = require('../config');

/**
 * error handler กลาง — ทุก error ออกทางเดียว รูปแบบเดียวกัน
 * ไม่ให้ stacktrace หลุดไปหา client ตอน production
 */
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const body = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status === 500 ? 'เกิดข้อผิดพลาดภายในระบบ' : err.message,
    },
  };
  if (err.details) body.error.details = err.details;
  if (config.env !== 'production' && status === 500) body.error.stack = err.stack;

  if (status === 500) console.error('[error]', err);
  res.status(status).json(body);
};
