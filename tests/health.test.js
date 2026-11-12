const request = require('supertest');
const createApp = require('../src/app');

const app = createApp({ logging: false });

describe('GET /api/v1/health', () => {
  it('ตอบ 200 พร้อมสถานะ ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('college-repair-api');
  });

  it('endpoint ที่ไม่มีอยู่จริงตอบ 404 รูปแบบ error กลาง', async () => {
    const res = await request(app).get('/api/v1/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
