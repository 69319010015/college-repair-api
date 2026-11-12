const router = require('express').Router();
const validate = require('../middleware/validate');
const { loginSchema } = require('../schemas/auth.schema');
const controller = require('../controllers/auth.controller');

router.post('/login', validate({ body: loginSchema }), controller.login);

module.exports = router;
