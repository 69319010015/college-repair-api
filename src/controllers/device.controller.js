const deviceService = require('../services/device.service');

function list(req, res, next) {
  try {
    res.json({ data: deviceService.listDevices({ q: req.query.q }) });
  } catch (error) {
    next(error);
  }
}

function create(req, res, next) {
  try {
    res.status(201).json({ data: deviceService.createDevice(req.body) });
  } catch (error) {
    next(error);
  }
}

function detail(req, res, next) {
  try {
    res.json({ data: deviceService.getDevice(req.params.id) });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, detail };
