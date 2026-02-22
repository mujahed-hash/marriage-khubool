const express = require('express');
const { protect } = require('../middleware/auth');
const Shortlist = require('../models/Shortlist');
const Profile = require('../models/Profile');
const { resolveProfileById } = require('../helpers/profiles');

const router = express.Router();

// GET /api/shortlist – list user's shortlisted profiles
router.get('/', protect, async (req, res) => {
    try {
        const items = await Shortlist.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .populate({ path: 'profileId', model: 'Profile' });
        const profiles = items
            .filter(i => i.profileId)
            .map(i => ({ ...i.profileId.toObject(), shortlistedAt: i.createdAt }));
        res.json({ profiles });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch shortlist.', error: err.message });
    }
});

// POST /api/shortlist – add to shortlist (profileId can be MongoDB _id or custom profileId)
router.post('/', protect, async (req, res) => {
    try {
        const { profileId } = req.body;
        if (!profileId) return res.status(400).json({ message: 'profileId is required.' });

        const profile = await resolveProfileById(profileId);
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });

        // Prevent self-shortlist
        if (profile.userId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot shortlist your own profile.' });
        }

        await Shortlist.create({ userId: req.user._id, profileId: profile._id });
        res.status(201).json({ message: 'Profile shortlisted.' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Already shortlisted.' });
        }
        res.status(500).json({ message: 'Failed to shortlist.', error: err.message });
    }
});

// DELETE /api/shortlist/:profileId – remove from shortlist (profileId can be MongoDB _id or custom profileId)
router.delete('/:profileId', protect, async (req, res) => {
    try {
        const profile = await resolveProfileById(req.params.profileId);
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });

        const result = await Shortlist.findOneAndDelete({
            userId: req.user._id,
            profileId: profile._id
        });
        if (!result) return res.status(404).json({ message: 'Not in shortlist.' });
        res.json({ message: 'Removed from shortlist.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove.', error: err.message });
    }
});

module.exports = router;
