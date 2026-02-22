const express = require('express');
const { protect } = require('../middleware/auth');
const Report = require('../models/Report');
const Profile = require('../models/Profile');
const { resolveProfileById } = require('../helpers/profiles');

const router = express.Router();

// POST /api/reports – submit a report (profileId can be MongoDB _id or custom profileId)
router.post('/', protect, async (req, res) => {
    try {
        const { profileId, reason } = req.body;
        if (!profileId || !reason) {
            return res.status(400).json({ message: 'profileId and reason are required.' });
        }

        const profile = await resolveProfileById(profileId);
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });

        if (profile.userId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot report your own profile.' });
        }

        await Report.create({ reporterId: req.user._id, reportedProfileId: profile._id, reason });
        res.status(201).json({ message: 'Report submitted. We will review it shortly.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to submit report.', error: err.message });
    }
});

module.exports = router;
