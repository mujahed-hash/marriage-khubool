const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').trim().notEmpty()
], authController.register);

router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], authController.login);

router.get('/me', protect, authController.me);

module.exports = router;
