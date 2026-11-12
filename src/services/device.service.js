const ApiError = require('../utils/ApiError');
const deviceRepository = require('../repositories/device.repository');

function listDevices({ q } = {}) {
  return deviceRepository.findAll((d) =>
    q ? `${d.assetCode} ${d.name} ${d.location}`.toLowerCase().includes(q.toLowerCase()) : true
  );
}

function createDevice(input) {
  if (deviceRepository.findByAssetCode(input.assetCode)) {
    throw ApiError.conflict('DUPLICATE_ASSET_CODE', 'รหัสครุภัณฑ์นี้มีอยู่แล้ว');
  }
  const now = new Date().toISOString();
  return deviceRepository.save({ id: deviceRepository.nextId(), ...input, createdAt: now });
}

function getDevice(id) {
  const device = deviceRepository.findById(id);
  if (!device) throw ApiError.notFound('ไม่พบอุปกรณ์นี้');
  return device;
}

module.exports = { listDevices, createDevice, getDevice };
