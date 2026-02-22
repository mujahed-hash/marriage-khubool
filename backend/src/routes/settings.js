const express = require('express');
const { protect } = require('../middleware/auth');
const Settings = require('../models/Settings');

const router = express.Router();

// GET /api/settings – get current user's settings
router.get('/', protect, async (req, res) => {
    try {
        let settings = await Settings.findOne({ userId: req.user._id });
        if (!settings) {
            // Create default settings on first access
            settings = await Settings.create({ userId: req.user._id });
        }
        res.json({ settings });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch settings.', error: err.message });
    }
});

// PUT /api/settings – update current user's settings
router.put('/', protect, async (req, res) => {
    try {
        const { notifications, privacy } = req.body;
        const update = {};
        if (notifications) update.notifications = notifications;
        if (privacy) update.privacy = privacy;

        const settings = await Settings.findOneAndUpdate(
            { userId: req.user._id },
            { $set: update },
            { new: true, upsert: true, runValidators: true }
        );
        res.json({ settings, message: 'Settings updated.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update settings.', error: err.message });
    }
});

module.exports = router;
