const crypto = require('crypto');
const config = require('../config');

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

/**
 * Token แบบ HMAC-SHA256 (payload.signature) — เพียงพอสำหรับโครงงานสัปดาห์นี้
 * เมื่อขึ้น production ให้เปลี่ยนเป็น JWT library + rotating secret
 */
function sign(payload) {
  const body = { ...payload, exp: Date.now() + config.auth.tokenTtlSeconds * 1000 };
  const encoded = base64url(JSON.stringify(body));
  const signature = crypto
    .createHmac('sha256', config.auth.secret)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

function verify(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  const expected = crypto
    .createHmac('sha256', config.auth.secret)
    .update(encoded)
    .digest('base64url');
  // ใช้ timingSafeEqual กัน timing attack แม้จะดูเล็กน้อยแต่เป็นนิสัยที่ควรทำ
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = { sign, verify };
