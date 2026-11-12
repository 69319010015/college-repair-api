const request = require('supertest');
const createApp = require('../src/app');
const deviceRepository = require('../src/repositories/device.repository');

const app = createApp({ logging: false });

async function loginAs(role, studentId = 'A001') {
  const res = await request(app).post('/api/v1/auth/login').send({ studentId, role });
  return res.body.data.token;
}

beforeEach(() => deviceRepository.clear());

describe('ทะเบียนอุปกรณ์', () => {
  it('ผู้ดูแลเพิ่มอุปกรณ์ได้ และรหัสครุภัณฑ์ซ้ำถูกปฏิเสธ (409)', async () => {
    const admin = await loginAs('ADMIN');
    const payload = { assetCode: 'CR-0001', name: 'คอมพิวเตอร์ห้อง 301', type: 'DESKTOP', location: 'อาคาร 3 ชั้น 1' };

    const first = await request(app)
      .post('/api/v1/devices')
      .set('Authorization', `Bearer ${admin}`)
      .send(payload);
    expect(first.status).toBe(201);

    const dup = await request(app)
      .post('/api/v1/devices')
      .set('Authorization', `Bearer ${admin}`)
      .send(payload);
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('DUPLICATE_ASSET_CODE');
  });

  it('นักศึกษาเพิ่มอุปกรณ์ไม่ได้ (403)', async () => {
    const student = await loginAs('STUDENT');
    const res = await request(app)
      .post('/api/v1/devices')
      .set('Authorization', `Bearer ${student}`)
      .send({ assetCode: 'CR-9', name: 'x', type: 'OTHER', location: 'y' });
    expect(res.status).toBe(403);
  });
});
