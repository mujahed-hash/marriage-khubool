const express = require('express');
const PlatformSettings = require('../models/PlatformSettings');
const Announcement = require('../models/Announcement');
const router = express.Router();

// Public - no auth required
router.get('/status', async (req, res) => {
    try {
        const settings = await PlatformSettings.findById('platform');
        res.json({
            maintenanceMode: settings?.maintenanceMode ?? false,
            maxPhotosPerUser: settings?.maxPhotosPerUser ?? 10
        });
    } catch (err) {
        res.json({ maintenanceMode: false, maxPhotosPerUser: 10 });
    }
});

router.get('/announcements/active', async (req, res) => {
    try {
        const now = new Date();
        const all = await Announcement.find({ active: true }).sort({ createdAt: -1 }).lean();
        const filtered = all.filter(a => {
            if (a.startDate && new Date(a.startDate) > now) return false;
            if (a.endDate && new Date(a.endDate) < now) return false;
            return true;
        });
        res.json(filtered);
    } catch (err) {
        res.json([]);
    }
});

module.exports = router;
