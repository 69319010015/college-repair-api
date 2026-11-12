const MemoryRepository = require('./memoryRepository');

class DeviceRepository extends MemoryRepository {
  constructor() {
    super({ prefix: 'dev' });
  }

  findByAssetCode(code) {
    return this.findAll((d) => d.assetCode === code)[0] || null;
  }
}

module.exports = new DeviceRepository();
