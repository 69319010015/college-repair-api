const ApiError = require('../utils/ApiError');
const { verify } = require('../utils/token');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('ต้องแนบ Authorization: Bearer <token>'));
  }
  const payload = verify(token);
  if (!payload) return next(ApiError.unauthorized('token ไม่ถูกต้องหรือหมดอายุ'));
  req.user = { id: payload.sub, name: payload.name, role: payload.role };
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`ต้องมีสิทธิ์: ${roles.join(', ')}`));
    }
    return next();
  };
}

module.exports = { authenticate, requireRole };
