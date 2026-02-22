const express = require('express');
const { protect } = require('../middleware/auth');
const Interest = require('../models/Interest');
const Profile = require('../models/Profile');
const { createNotification } = require('../helpers/notifications');
const { resolveProfileById } = require('../helpers/profiles');

const router = express.Router();

// GET /api/interest/sent – list sent interests
router.get('/sent', protect, async (req, res) => {
    try {
        const interests = await Interest.find({ fromUserId: req.user._id })
            .sort({ createdAt: -1 })
            .populate({ path: 'toProfileId', model: 'Profile' });
        // Include interest status so frontend can show it
        const enriched = interests.map(i => {
            const profile = i.toProfileId?.toObject ? i.toProfileId.toObject() : i.toProfileId || {};
            return { ...profile, interestId: i._id, interestStatus: i.status, sentAt: i.createdAt };
        });
        res.json({ interests: enriched });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch sent interests.', error: err.message });
    }
});

// GET /api/interest/received – list received interests
router.get('/received', protect, async (req, res) => {
    try {
        const myProfile = await Profile.findOne({ userId: req.user._id });
        if (!myProfile) return res.json({ interests: [] });

        const interests = await Interest.find({ toProfileId: myProfile._id })
            .sort({ createdAt: -1 })
            .populate({ path: 'fromUserId', model: 'User', select: '-password' })
            .lean();
        const enriched = [];
        for (const i of interests) {
            const senderProfile = await Profile.findOne({ userId: i.fromUserId?._id })
                .select('fullName profileId profilePhotoUrl city occupation gender');
            enriched.push({
                interestId: i._id,
                interestStatus: i.status,
                sentAt: i.createdAt,
                senderProfile: senderProfile ? senderProfile.toObject() : null
            });
        }
        res.json({ interests: enriched });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch received interests.', error: err.message });
    }
});

// POST /api/interest/:profileId – send interest (profileId can be MongoDB _id or custom profileId)
router.post('/:profileId', protect, async (req, res) => {
    try {
        const profile = await resolveProfileById(req.params.profileId);
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });

        if (profile.userId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot send interest to yourself.' });
        }

        const interest = await Interest.create({ fromUserId: req.user._id, toProfileId: profile._id });
        const senderName = req.user.fullName || 'Someone';
        await createNotification(
            profile.userId,
            'interest_received',
            `${senderName} sent you an interest`,
            interest._id
        );
        res.status(201).json({ message: 'Interest sent.' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Interest already sent.' });
        }
        res.status(500).json({ message: 'Failed to send interest.', error: err.message });
    }
});

// PUT /api/interest/:interestId/accept – accept an interest
router.put('/:interestId/accept', protect, async (req, res) => {
    try {
        const myProfile = await Profile.findOne({ userId: req.user._id });
        if (!myProfile) return res.status(404).json({ message: 'Create your profile first.' });

        const interest = await Interest.findById(req.params.interestId);
        if (!interest) return res.status(404).json({ message: 'Interest not found.' });

        // Verify this interest is addressed to the logged-in user's profile
        if (interest.toProfileId.toString() !== myProfile._id.toString()) {
            return res.status(403).json({ message: 'You can only act on interests sent to you.' });
        }

        interest.status = 'accepted';
        await interest.save();
        const accepterName = req.user.fullName || 'Someone';
        await createNotification(
            interest.fromUserId,
            'interest_accepted',
            `${accepterName} accepted your interest`,
            interest._id
        );
        res.json({ message: 'Interest accepted.', status: 'accepted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to accept interest.', error: err.message });
    }
});

// PUT /api/interest/:interestId/reject – reject an interest
router.put('/:interestId/reject', protect, async (req, res) => {
    try {
        const myProfile = await Profile.findOne({ userId: req.user._id });
        if (!myProfile) return res.status(404).json({ message: 'Create your profile first.' });

        const interest = await Interest.findById(req.params.interestId);
        if (!interest) return res.status(404).json({ message: 'Interest not found.' });

        if (interest.toProfileId.toString() !== myProfile._id.toString()) {
            return res.status(403).json({ message: 'You can only act on interests sent to you.' });
        }

        interest.status = 'rejected';
        await interest.save();
        res.json({ message: 'Interest rejected.', status: 'rejected' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to reject interest.', error: err.message });
    }
});

module.exports = router;

