const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../utils/validators');

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
