# ระบบแจ้งซ่อมคอมพิวเตอร์และอุปกรณ์ของวิทยาลัย — Back-End API
# College Computer Repair & Equipment Service System — Back-End API

Back-End API สำหรับระบบแจ้งซ่อมคอมพิวเตอร์และอุปกรณ์ของวิทยาลัย
รองรับการแจ้งซ่อม การติดตามสถานะงานซ่อมตามลำดับขั้น และการจัดการทะเบียนอุปกรณ์ของผู้ใช้งาน

Back-End API for a college repair-request system: submitting repair tickets,
tracking their status through a strict state machine, and managing the device registry.

- **Stack:** Node.js (>= 20) · Express 4 · zod · Vitest + Supertest
- **Tests:** 10 automated tests, all passing (`npm test`)

---

## 1. ภาพรวมระบบ (System overview)

| ผู้ใช้ | ทำอะไรได้ | ข้อจำกัด |
|---|---|---|
| นักศึกษา / บุคลากร (`STUDENT`) | แจ้งซ่อม ติดตามสถานะ ยกเลิกคำขอของตนเอง | เห็นเฉพาะใบงานของตนเอง / ยกเลิกได้เฉพาะก่อนช่างรับเรื่อง |
| ช่างเทคนิค (`TECHNICIAN`) | รับเรื่อง เริ่มซ่อม บันทึกผล | ปิดงานเองไม่ได้ |
| ผู้ดูแลระบบ (`ADMIN`) | จัดการอุปกรณ์ ผู้ใช้ ปิดงาน ออกรายงาน | — |

### วงจรสถานะงานซ่อม (Ticket state machine)

```
PENDING ──► ACCEPTED ──► IN_PROGRESS ──► COMPLETED ──► CLOSED
   │            │
   ├──► REJECTED (ช่าง/ผู้ดูแล)
   └──► CANCELED (ผู้แจ้ง ยกเลิกได้เฉพาะตอน PENDING)
```

กฎอยู่ในโค้ดที่ [`src/domain/ticketStatus.js`](src/domain/ticketStatus.js) — การข้ามขั้น
ถูกปฏิเสธด้วย `409 INVALID_STATE` และการเปลี่ยนสถานะที่บทบาทไม่มีสิทธิ์ถูกปฏิเสธด้วย `403 FORBIDDEN`

---

## 2. โครงสร้างโปรเจกต์ (Project structure)

```
.
├── src/
│   ├── app.js                  # ประกอบ middleware + routes (แยกจาก server เพื่อให้เทสต์ได้)
│   ├── server.js               # entry point: listen + graceful shutdown
│   ├── config/                 # อ่านค่าจาก .env ที่เดียว
│   ├── domain/                 # กฎธุรกิจล้วน: roles, ticketStatus (+state machine)
│   ├── schemas/                # zod schema ตรวจข้อมูลขาเข้า
│   ├── routes/                 # นิยาม endpoint + ผูก middleware
│   ├── controllers/            # รับ req → เรียก service → ส่ง response
│   ├── services/               # business logic
│   ├── repositories/           # ชั้นเข้าถึงข้อมูล (สัปดาห์นี้เป็น in-memory)
│   ├── middleware/             # auth, requireRole, validate, error handler, 404
│   └── utils/                  # ApiError, token (HMAC)
├── tests/                      # health, tickets, devices (Vitest + Supertest)
├── docs/
│   ├── uml/                    # Use Case, Class, Sequence, State, ER (.svg + .drawio)
│   └── laporan-*.docx          # รายงานวิเคราะห์และออกแบบ (ถ้ามี)
├── .env.example
├── package.json
└── README.md
```

---

## 3. เริ่มต้นใช้งาน (Getting started)

```bash
git clone https://github.com/69319010015/college-repair-api.git
cd college-repair-api
npm install
cp .env.example .env        # แล้วแก้ค่า AUTH_SECRET
npm run dev                 # http://localhost:3000
npm test                    # รันชุดทดสอบทั้งหมด
```

Environment variables (ดู `.env.example`): `PORT`, `NODE_ENV`, `AUTH_SECRET`, `TOKEN_TTL_SECONDS`

---

## 4. API

Base path: `/api/v1`

| Method | Path | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| GET | `/health` | สาธารณะ | สถานะระบบ (service, version, uptime) |
| POST | `/auth/login` | สาธารณะ | ออก token จาก `studentId` + `role` (เดโม) |
| GET | `/tickets` | ทุกบทบาท | รายการใบงาน + `?status=` `?q=` `?page=` `?limit=` |
| POST | `/tickets` | STUDENT, ADMIN | แจ้งซ่อม → ได้ `ticketNo` เช่น `RP-2569-0001` |
| GET | `/tickets/:id` | เจ้าของ / ช่าง / ADMIN | รายละเอียด + ประวัติสถานะ |
| PATCH | `/tickets/:id/status` | ตาม state machine | เปลี่ยนสถานะ |
| GET | `/devices` | ทุกบทบาท | ทะเบียนอุปกรณ์ |
| POST | `/devices` | ADMIN | เพิ่มอุปกรณ์ (รหัสครุภัณฑ์ห้ามซ้ำ) |
| GET | `/devices/:id` | ทุกบทบาท | รายละเอียดอุปกรณ์ |

### ตัวอย่าง

```bash
# 1) เข้าสู่ระบบ (เดโม)
TOKEN=$(curl -s -X POST localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"studentId":"S001","fullName":"กมล","role":"STUDENT"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")

# 2) แจ้งซ่อม
curl -s -X POST localhost:3000/api/v1/tickets \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"โปรเจคเตอร์ห้อง 402 ภาพไม่ขึ้น","description":"เปิดแล้วภาพไม่ขึ้น มีเสียงพัดลมปกติ","category":"PROJECTOR","priority":"HIGH"}'

# 3) ดูรายการที่กรองสถานะ + แบ่งหน้า
curl -s "localhost:3000/api/v1/tickets?status=PENDING&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

รูปแบบ error ทุก endpoint เหมือนกัน:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "ข้อมูลที่ส่งมาไม่ถูกต้อง",
             "details": [{ "path": "title", "message": "หัวข้อต้องยาวอย่างน้อย 5 ตัวอักษร" }] } }
```

---

## 5. การออกแบบ (Design / UML)

แผนภาพอยู่ใน [`docs/uml/`](docs/uml/) — แต่ละแผนภาพมีทั้ง `.svg` (ดู/พิมพ์) และ `.drawio` (แก้ใน [diagrams.net](https://app.diagrams.net) ได้)

| แผนภาพ | ไฟล์ | เนื้อหา |
|---|---|---|
| Use Case | `use-case.*` | 3 ผู้ใช้ → 11 use case |
| Class | `class-diagram.*` | User, Device, RepairTicket, StatusLog + enum TicketStatus |
| Sequence | `sequence-แจ้งซ่อม.*` | ผู้แจ้งส่งคำขอ → service → repository → ช่างรับเรื่อง |
| State | `state-งานซ่อม.*` | วงจรชีวิตใบงาน 7 สถานะ |
| ER | `erd.*` | 4 ตาราง: users, devices, repair_tickets, ticket_status_logs |

---

## 6. ข้อจำกัดที่ทราบอยู่ (Known limitations)

- **ข้อมูลอยู่ในหน่วยความจำ** — รีสตาร์ทเซิร์ฟเวอร์แล้วข้อมูลหาย สลับเป็น PostgreSQL ได้โดยเขียน
  repository ใหม่ที่ interface เดิม (`src/repositories/`) ตามสคีมาใน `docs/uml/erd.svg`
- **auth เป็นเดโม** — `/auth/login` รับ `studentId` + `role` แล้วออก token โดยยังไม่ตรวจรหัสผ่าน
  ห้ามใช้ใน production: ต้องต่อตาราง `users` + password hash และจำกัดการขอสิทธิ์ ADMIN
- ยังไม่มี: อัปโหลดไฟล์ภาพหลักฐาน, การแจ้งเตือน (อีเมล/LINE), รายงานสรุปสำหรับผู้บริหาร, CI

## 7. แผนถัดไป (Roadmap)

1. PostgreSQL + migration ตาม ER diagram, seed ข้อมูลตัวอย่าง
2. ยืนยันตัวตนจริง (argon2/bcrypt) + refresh token
3. อัปโหลดหลักฐานการเสีย (จำกัดชนิด/ขนาดไฟล์)
4. แจ้งเตือนเมื่อรับเรื่อง / ซ่อมเสร็จ
5. รายงานและ SLA (เวลาตอบรับ–เวลาซ่อมเสร็จ)
6. GitHub Actions (lint + test), rate limit, OpenAPI/Swagger

## License

MIT
