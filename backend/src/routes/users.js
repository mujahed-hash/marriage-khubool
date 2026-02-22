const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Placeholder for user-related routes (settings, etc.)
router.get('/me', protect, (req, res) => {
    res.json(req.user);
});

module.exports = router;
