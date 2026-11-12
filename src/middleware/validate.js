const ApiError = require('../utils/ApiError');

/**
 * ตรวจความถูกต้องของ req ที่ขอบ API ก่อนเข้า controller
 * ใช้ซ้ำได้ทั้ง body/query/params — ไม่ต้องเขียน if ตรวจเองในทุก endpoint
 */
module.exports = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    if (schemas.query) req.validatedQuery = schemas.query.parse(req.query ?? {});
    if (schemas.params) req.params = { ...req.params, ...schemas.params.parse(req.params ?? {}) };
    return next();
  } catch (error) {
    if (error.issues) {
      const details = error.issues.map((i) => ({
        path: i.path.join('.') || '(root)',
        message: i.message,
      }));
      return next(ApiError.badRequest('ข้อมูลที่ส่งมาไม่ถูกต้อง', details));
    }
    return next(error);
  }
};
