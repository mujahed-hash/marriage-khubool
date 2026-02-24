const express = require('express');
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

router.use(protect);

// GET /api/notifications – list user's notifications
router.get('/', async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 50, 100);
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
        res.json({ notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch notifications.', error: err.message });
    }
});

// PUT /api/notifications/:id/read – mark one as read
router.put('/:id/read', async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { read: true }
        );
        res.json({ message: 'Marked as read.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update notification.', error: err.message });
    }
});

// PUT /api/notifications/read-all – mark all as read
router.put('/read-all', async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user._id }, { read: true });
        res.json({ message: 'All marked as read.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update notifications.', error: err.message });
    }
});

module.exports = router;
