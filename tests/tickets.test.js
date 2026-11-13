const request = require('supertest');
const createApp = require('../src/app');
const ticketRepository = require('../src/repositories/ticket.repository');
const deviceRepository = require('../src/repositories/device.repository');

const app = createApp({ logging: false });

async function loginAs(role, studentId = 'S001') {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ studentId, fullName: `ผู้ใช้ ${role}`, role });
  expect(res.status).toBe(200);
  return res.body.data.token;
}

const newTicket = {
  title: 'คอมพิวเตอร์เปิดไม่ติด',
  description: 'กดปุ่มเปิดแล้วไม่มีไฟเข้า หน้าจอดำสนิท',
  category: 'COMPUTER',
  priority: 'HIGH',
};

beforeEach(() => {
  ticketRepository.clear();
  deviceRepository.clear();
});

describe('ระบบแจ้งซ่อม — flow หลัก', () => {
  it('นักศึกษาแจ้งซ่อมได้ และได้เลขที่ใบงานอัตโนมัติ', async () => {
    const token = await loginAs('STUDENT');
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send(newTicket);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.ticketNo).toMatch(/^RP-\d{4}-\d{4}$/);
  });

  it('ข้อมูลไม่ครบถ้วนตอบ 400 พร้อมรายละเอียดรายฟิลด์', async () => {
    const token = await loginAs('STUDENT');
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'สั้น' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('ไม่มี token ตอบ 401', async () => {
    const res = await request(app).get('/api/v1/tickets');
    expect(res.status).toBe(401);
  });

  it('ช่างซ่อมรับเรื่องและปิดงานได้ตามลำดับสถานะ', async () => {
    const student = await loginAs('STUDENT');
    const tech = await loginAs('TECHNICIAN', 'T100');

    const created = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${student}`)
      .send(newTicket);
    const id = created.body.data.id;

    const accepted = await request(app)
      .patch(`/api/v1/tickets/${id}/status`)
      .set('Authorization', `Bearer ${tech}`)
      .send({ status: 'ACCEPTED' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.assignedTo).toBe('T100');

    const completed = await request(app)
      .patch(`/api/v1/tickets/${id}/status`)
      .set('Authorization', `Bearer ${tech}`)
      .send({ status: 'COMPLETED', note: 'เปลี่ยนเพาเวอร์ซัพพลาย' });
    expect([200, 409]).toContain(completed.status);
    // ข้ามขั้น (ACCEPTED → COMPLETED ต้องผ่าน IN_PROGRESS ก่อน)
    expect(completed.status).toBe(409);
    expect(completed.body.error.code).toBe('INVALID_STATE');
  });

  it('ช่างพักงานเป็น "รออะไหล่" แล้วกลับมาซ่อมต่อได้ และปิดงานเป็นซ่อมเสร็จ', async () => {
    const student = await loginAs('STUDENT');
    const tech = await loginAs('TECHNICIAN', 'T100');

    const created = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${student}`)
      .send(newTicket);
    const id = created.body.data.id;

    const patch = (token, body) => request(app)
      .patch(`/api/v1/tickets/${id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect((await patch(tech, { status: 'ACCEPTED' })).status).toBe(200);
    expect((await patch(tech, { status: 'IN_PROGRESS' })).status).toBe(200);

    // อะไหล่หมด → รออะไหล่
    const waiting = await patch(tech, { status: 'WAITING_PARTS', note: 'รอฮาร์ดดิสก์จากคลัง' });
    expect(waiting.status).toBe(200);
    expect(waiting.body.data.status).toBe('WAITING_PARTS');
    expect(waiting.body.data.statusLabel).toBe('รออะไหล่');

    // อะไหล่มาแล้ว → กลับมาซ่อมต่อ
    const resumed = await patch(tech, { status: 'IN_PROGRESS', note: 'อะไหล่มาแล้ว' });
    expect(resumed.status).toBe(200);

    const done = await patch(tech, { status: 'COMPLETED', note: 'เปลี่ยนฮาร์ดดิสก์ใหม่' });
    expect(done.status).toBe(200);
    expect(done.body.data.status).toBe('COMPLETED');
    expect(done.body.data.statusLabel).toBe('ซ่อมเสร็จ');

    // ประวัติการเปลี่ยนสถานะต้องครบทุกครั้ง ไม่เขียนทับ
    expect(done.body.data.statusHistory.map((h) => h.status))
      .toEqual(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'WAITING_PARTS', 'IN_PROGRESS', 'COMPLETED']);
  });

  it('ข้ามขั้นเป็น "รออะไหล่" ทันทีจากรอดำเนินการไม่ได้ (409)', async () => {
    const student = await loginAs('STUDENT');
    const tech = await loginAs('TECHNICIAN', 'T100');
    const created = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${student}`)
      .send(newTicket);

    const res = await request(app)
      .patch(`/api/v1/tickets/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${tech}`)
      .send({ status: 'WAITING_PARTS' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INVALID_STATE');
  });

  it('นักศึกษาไม่มีสิทธิ์ตั้งสถานะ IN_PROGRESS (403)', async () => {
    const student = await loginAs('STUDENT');
    const created = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${student}`)
      .send(newTicket);

    const res = await request(app)
      .patch(`/api/v1/tickets/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${student}`)
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('นักศึกษาเห็นเฉพาะใบงานของตนเอง และกรองตามสถานะได้', async () => {
    const a = await loginAs('STUDENT', 'S001');
    const b = await loginAs('STUDENT', 'S002');

    await request(app).post('/api/v1/tickets').set('Authorization', `Bearer ${a}`).send(newTicket);
    await request(app).post('/api/v1/tickets').set('Authorization', `Bearer ${b}`).send(newTicket);

    const res = await request(app)
      .get('/api/v1/tickets?status=PENDING&page=1&limit=10')
      .set('Authorization', `Bearer ${a}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].requesterId).toBe('S001');
    expect(res.body.meta.total).toBe(1);
  });
});
