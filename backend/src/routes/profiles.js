const express = require('express');
const profileController = require('../controllers/profileController');
const { protect, optionalProtect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ProfileVisitor = require('../models/ProfileVisitor');
const Profile = require('../models/Profile');
const Shortlist = require('../models/Shortlist');
const Interest = require('../models/Interest');
const Block = require('../models/Block');
const { createNotification } = require('../helpers/notifications');
const { resolveProfileById } = require('../helpers/profiles');

const router = express.Router();

router.post('/', protect, profileController.createOrUpdate);
router.put('/', protect, profileController.createOrUpdate);
// --- Antigravity: Profile Visitor routes (before /me) ---
router.get('/me/visitors', protect, async (req, res) => {
    try {
        const myProfile = await Profile.findOne({ userId: req.user._id });
        if (!myProfile) return res.json({ visitors: [] });
        const visitors = await ProfileVisitor.find({ profileId: myProfile._id })
            .sort({ viewedAt: -1 }).limit(50)
            .populate({ path: 'viewerId', model: 'User', select: 'fullName email gender membershipTier' });
        const enriched = [];
        for (const v of visitors) {
            const vp = await Profile.findOne({ userId: v.viewerId?._id }).select('profilePhotoUrl fullName profileId city');
            enriched.push({ viewer: v.viewerId, viewerProfile: vp || null, viewedAt: v.viewedAt });
        }
        res.json({ visitors: enriched });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch visitors.', error: err.message });
    }
});

router.get('/me/photos', protect, profileController.getMyPhotos);
router.get('/me', protect, profileController.getMyProfile);
router.post('/me/photos', protect, upload.single('photo'), profileController.uploadPhoto);
router.put('/me/photos/:photoId/primary', protect, profileController.setPrimaryPhoto);
router.delete('/me/photos/:photoId', protect, profileController.deletePhoto);
router.delete('/me', protect, profileController.deleteMyProfile);
router.get('/sample', profileController.getSampleProfile);
router.get('/list', optionalProtect, profileController.getProfiles);
// --- Antigravity: Record profile view (before /:id) ---
router.post('/:id/view', protect, async (req, res) => {
    try {
        const profile = await resolveProfileById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });
        if (profile.userId.toString() === req.user._id.toString()) {
            return res.json({ message: 'Self-view not recorded.' });
        }
        await ProfileVisitor.findOneAndUpdate(
            { viewerId: req.user._id, profileId: profile._id },
            { viewedAt: new Date() },
            { upsert: true }
        );
        const viewerName = req.user.fullName || 'Someone';
        await createNotification(
            profile.userId,
            'profile_visited',
            `${viewerName} viewed your profile`,
            profile._id
        );
        res.json({ message: 'Visit recorded.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to record visit.', error: err.message });
    }
});

// GET /api/profiles/:id/actions – shortlisted, interestSent, blocked for current user (id can be MongoDB _id or custom profileId)
router.get('/:id/actions', protect, async (req, res) => {
    try {
        const profile = await resolveProfileById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });

        const [shortlisted, interest, block] = await Promise.all([
            Shortlist.findOne({ userId: req.user._id, profileId: profile._id }),
            Interest.findOne({ fromUserId: req.user._id, toProfileId: profile._id }),
            Block.findOne({ blockerId: req.user._id, blockedProfileId: profile._id })
        ]);

        res.json({
            shortlisted: !!shortlisted,
            interestSent: !!interest,
            blocked: !!block
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch actions.', error: err.message });
    }
});

router.get('/:id', profileController.getProfileById);

// PUT /api/profiles/me/deactivate – deactivate profile
router.put('/me/deactivate', protect, async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user._id });
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });
        profile.isActive = false;
        await profile.save();
        res.json({ message: 'Profile deactivated.', isActive: false });
    } catch (err) {
        res.status(500).json({ message: 'Failed to deactivate profile.', error: err.message });
    }
});

// PUT /api/profiles/me/activate – reactivate profile
router.put('/me/activate', protect, async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user._id });
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });
        profile.isActive = true;
        await profile.save();
        res.json({ message: 'Profile activated.', isActive: true });
    } catch (err) {
        res.status(500).json({ message: 'Failed to activate profile.', error: err.message });
    }
});

module.exports = router;
