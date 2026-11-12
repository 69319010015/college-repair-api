/**
 * In-memory repository — ตั้งใจให้เป็น “ที่เดียว” ที่ข้อมูลถูกเก็บ
 * เมื่อต่อฐานข้อมูลจริง (Prisma/Knex) ให้สร้าง repository ตัวใหม่ที่ interface เดียวกัน
 * แล้วสลับที่ src/repositories/index.js โดยไม่ต้องแก้ service/controller
 */
class MemoryRepository {
  constructor({ prefix = 'id' } = {}) {
    this.items = new Map();
    this.prefix = prefix;
    this.counter = 0;
  }

  nextId() {
    this.counter += 1;
    return `${this.prefix}_${String(this.counter).padStart(4, '0')}`;
  }

  findById(id) {
    return this.items.get(id) || null;
  }

  findAll(predicate = () => true) {
    return [...this.items.values()].filter(predicate);
  }

  save(entity) {
    this.items.set(entity.id, entity);
    return entity;
  }

  clear() {
    this.items.clear();
    this.counter = 0;
  }
}

module.exports = MemoryRepository;
