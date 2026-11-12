const MemoryRepository = require('./memoryRepository');

class TicketRepository extends MemoryRepository {
  constructor() {
    super({ prefix: 'tkt' });
    this.ticketSeq = 0;
  }

  nextTicketNo(year = new Date().getFullYear() + 543) {
    this.ticketSeq += 1;
    return `RP-${year}-${String(this.ticketSeq).padStart(4, '0')}`;
  }
}

module.exports = new TicketRepository();
