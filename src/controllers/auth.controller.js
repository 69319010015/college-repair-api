const authService = require('../services/auth.service');

function login(req, res, next) {
  try {
    res.json({ data: authService.login(req.body) });
  } catch (error) {
    next(error);
  }
}

module.exports = { login };
