/**
 * Error ที่พก HTTP status + machine-readable code มาด้วย
 * ใช้คู่กับ errorHandler กลางเพื่อให้ response มีรูปแบบเดียวกันทุก endpoint
 */
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'ต้องเข้าสู่ระบบก่อนใช้งาน') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'ไม่มีสิทธิ์ดำเนินการนี้') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'ไม่พบข้อมูลที่ร้องขอ') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(code, message) {
    return new ApiError(409, code, message);
  }
}

module.exports = ApiError;
