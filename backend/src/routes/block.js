const express = require('express');
const { protect } = require('../middleware/auth');
const Block = require('../models/Block');
const Profile = require('../models/Profile');
const { resolveProfileById } = require('../helpers/profiles');

const router = express.Router();

// GET /api/block – list blocked profiles
router.get('/', protect, async (req, res) => {
    try {
        const blocks = await Block.find({ blockerId: req.user._id })
            .sort({ createdAt: -1 })
            .populate({ path: 'blockedProfileId', model: 'Profile', select: 'fullName profileId profilePhotoUrl city gender' });
        const profiles = blocks
            .map(b => b.blockedProfileId)
            .filter(p => p != null);
        res.json({ profiles });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch blocked profiles.', error: err.message });
    }
});

// POST /api/block/:profileId – block a profile (profileId can be MongoDB _id or custom profileId)
router.post('/:profileId', protect, async (req, res) => {
    try {
        const profile = await resolveProfileById(req.params.profileId);
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });

        if (profile.userId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot block yourself.' });
        }

        await Block.create({ blockerId: req.user._id, blockedProfileId: profile._id });
        res.status(201).json({ message: 'Profile blocked.' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Profile already blocked.' });
        }
        res.status(500).json({ message: 'Failed to block profile.', error: err.message });
    }
});

// DELETE /api/block/:profileId – unblock a profile (profileId can be MongoDB _id or custom profileId)
router.delete('/:profileId', protect, async (req, res) => {
    try {
        const profile = await resolveProfileById(req.params.profileId);
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });

        await Block.findOneAndDelete({ blockerId: req.user._id, blockedProfileId: profile._id });
        res.json({ message: 'Profile unblocked.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to unblock profile.', error: err.message });
    }
});

// GET /api/block/check/:profileId – check if profile is blocked (profileId can be MongoDB _id or custom profileId)
router.get('/check/:profileId', protect, async (req, res) => {
    try {
        const profile = await resolveProfileById(req.params.profileId);
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });

        const block = await Block.findOne({ blockerId: req.user._id, blockedProfileId: profile._id });
        res.json({ blocked: !!block });
    } catch (err) {
        res.status(500).json({ message: 'Failed to check block status.', error: err.message });
    }
});

module.exports = router;
