const ApiError = require('../utils/ApiError');

module.exports = (req, res, next) => {
  next(ApiError.notFound(`ไม่พบ endpoint: ${req.method} ${req.originalUrl}`));
};
