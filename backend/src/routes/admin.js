const express = require('express');
const { adminAuth } = require('../middleware/adminAuth');
const { logAdminAction } = require('../helpers/adminAudit');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Report = require('../models/Report');
const MembershipOrder = require('../models/MembershipOrder');
const Interest = require('../models/Interest');
const AdminAuditLog = require('../models/AdminAuditLog');
const PlatformSettings = require('../models/PlatformSettings');
const Announcement = require('../models/Announcement');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { generateToken } = require('../controllers/authController');
const router = express.Router();

// All routes are admin-only
router.use(adminAuth);

const MAX_LIMIT = 100;
function safeLimit(val, defaultVal = 20) { return Math.min(Number(val) || defaultVal, MAX_LIMIT); }

// ─── GET /api/admin/stats ───────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalUsers,
            totalProfiles,
            newUsersToday,
            newUsersThisWeek,
            newUsersThisMonth,
            pendingReports,
            totalOrders,
            revenueData,
            totalInterests,
            acceptedInterests
        ] = await Promise.all([
            User.countDocuments(),
            Profile.countDocuments({ isActive: { $ne: false } }),
            User.countDocuments({ createdAt: { $gte: startOfDay } }),
            User.countDocuments({ createdAt: { $gte: startOfWeek } }),
            User.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Report.countDocuments({ status: { $in: ['pending', undefined, null] } }),
            MembershipOrder ? MembershipOrder.countDocuments() : Promise.resolve(0),
            MembershipOrder ? MembershipOrder.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]) : Promise.resolve([]),
            Interest.countDocuments(),
            Interest.countDocuments({ status: 'accepted' })
        ]);

        const revenueTotal = revenueData?.[0]?.total || 0;

        // Registrations per day for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const registrationChart = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totalUsers,
            totalProfiles,
            newUsersToday,
            newUsersThisWeek,
            newUsersThisMonth,
            pendingReports,
            totalOrders,
            revenueTotal,
            totalInterests,
            acceptedInterests,
            registrationChart
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/users ────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, tier, verified, suspended, search } = req.query;
        const safePage = Math.max(Number(page) || 1, 1);
        const lim = safeLimit(limit, 20);
        const filter = {};
        if (tier) filter.membershipTier = tier;
        if (verified !== undefined) filter.verified = verified === 'true';
        if (suspended !== undefined) filter.isSuspended = suspended === 'true';
        if (search) {
            const or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
            // Check if search might be an ObjectId
            if (search.match(/^[0-9a-fA-F]{24}$/)) {
                or.push({ _id: search });
            }
            filter.$or = or;
        }

        const skip = (safePage - 1) * lim;
        const [users, total] = await Promise.all([
            User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
            User.countDocuments(filter)
        ]);

        // Enrich with profile data
        const userIds = users.map(u => u._id);
        const profiles = await Profile.find({ userId: { $in: userIds } })
            .select('userId fullName profilePhotoUrl profileId gender')
            .lean();
        const profileMap = {};
        profiles.forEach(p => { profileMap[p.userId.toString()] = p; });

        const enriched = users.map(u => ({
            ...u,
            profile: profileMap[u._id.toString()] || null
        }));

        res.json({ users: enriched, total, page: safePage, pages: Math.ceil(total / lim) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /api/admin/users ───────────────────────────────────────────────────
router.post('/users', async (req, res) => {
    try {
        const { email, password, fullName, gender, membershipTier, isAdmin, verified } = req.body;
        if (!email || !password || !fullName) {
            return res.status(400).json({ message: 'Email, password, and full name are required.' });
        }
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already registered.' });

        const user = await User.create({
            email, password, fullName,
            gender: gender || undefined,
            membershipTier: membershipTier || 'bronze',
            isAdmin: isAdmin || false,
            verified: verified || false
        });
        user.password = undefined;
        res.status(201).json({ message: 'User created.', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/users/:id ────────────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const profile = await Profile.findOne({ userId: req.params.id });
        res.json({ user, profile });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PUT /api/admin/users/:id/suspend ────────────────────────────────────────
router.put('/users/:id/suspend', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        user.isSuspended = !user.isSuspended;
        await user.save();
        await logAdminAction({ adminId: req.user._id, action: 'suspend_user', resource: 'user', resourceId: user._id, details: { isSuspended: user.isSuspended, email: user.email }, req });
        res.json({ message: user.isSuspended ? 'User suspended.' : 'User unsuspended.', isSuspended: user.isSuspended });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PUT /api/admin/users/:id/verify ─────────────────────────────────────────
router.put('/users/:id/verify', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { verified: true }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        await logAdminAction({ adminId: req.user._id, action: 'verify_user', resource: 'user', resourceId: user._id, details: { email: user.email }, req });
        res.json({ message: 'User verified.', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PUT /api/admin/users/:id/membership ─────────────────────────────────────
router.put('/users/:id/membership', async (req, res) => {
    try {
        const { tier } = req.body;
        const validTiers = ['bronze', 'silver', 'gold', 'diamond', 'crown'];
        if (!validTiers.includes(tier)) return res.status(400).json({ message: 'Invalid tier.' });
        const user = await User.findByIdAndUpdate(req.params.id, { membershipTier: tier }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        await logAdminAction({ adminId: req.user._id, action: 'set_membership', resource: 'user', resourceId: user._id, details: { tier, email: user.email }, req });
        res.json({ message: `Membership updated to ${tier}.`, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (user.isAdmin) return res.status(403).json({ message: 'Cannot delete another admin.' });
        await Profile.findOneAndDelete({ userId: req.params.id });
        await User.findByIdAndDelete(req.params.id);
        await logAdminAction({ adminId: req.user._id, action: 'delete_user', resource: 'user', resourceId: req.params.id, details: { email: user.email }, req });
        res.json({ message: 'User and profile deleted.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/profiles ──────────────────────────────────────────────────
router.get('/profiles', async (req, res) => {
    try {
        const { page = 1, limit = 20, gender, state, tier, isActive, search } = req.query;
        const safePage = Math.max(Number(page) || 1, 1);
        const lim = safeLimit(limit, 20);
        const filter = {};
        if (gender) filter.gender = gender;
        if (state) filter.state = state;
        if (isActive !== undefined) filter.isActive = isActive !== 'false';
        if (search) {
            const or = [
                { fullName: { $regex: search, $options: 'i' } },
                { profileId: { $regex: search, $options: 'i' } }
            ];
            if (search.match(/^[0-9a-fA-F]{24}$/)) {
                or.push({ _id: search });
            }
            filter.$or = or;
        }

        const skip = (safePage - 1) * lim;

        let query = Profile.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim);
        if (tier) {
            // Join with User to filter by tier
            const userIds = (await User.find({ membershipTier: tier }).select('_id')).map(u => u._id);
            filter.userId = { $in: userIds };
        }

        const [profiles, total] = await Promise.all([
            Profile.find(filter).populate('userId', 'fullName email membershipTier verified isSuspended').sort({ createdAt: -1 }).skip(skip).limit(lim),
            Profile.countDocuments(filter)
        ]);

        res.json({ profiles, total, page: safePage, pages: Math.ceil(total / lim) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/profiles/:id ─────────────────────────────────────────────
router.get('/profiles/:id', async (req, res) => {
    try {
        const profile = await Profile.findById(req.params.id).populate('userId', '-password');
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });
        res.json(profile);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PUT /api/admin/profiles/:id/deactivate ───────────────────────────────────
router.put('/profiles/:id/deactivate', async (req, res) => {
    try {
        const profile = await Profile.findById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });
        profile.isActive = !profile.isActive;
        await profile.save();
        await logAdminAction({ adminId: req.user._id, action: 'deactivate_profile', resource: 'profile', resourceId: profile._id, details: { isActive: profile.isActive, fullName: profile.fullName }, req });
        res.json({ message: profile.isActive ? 'Profile activated.' : 'Profile deactivated.', isActive: profile.isActive });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PUT /api/admin/profiles/:id/feature ─────────────────────────────────────
router.put('/profiles/:id/feature', async (req, res) => {
    try {
        const profile = await Profile.findById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });
        profile.featured = !profile.featured;
        await profile.save();
        await logAdminAction({ adminId: req.user._id, action: 'feature_profile', resource: 'profile', resourceId: profile._id, details: { featured: profile.featured, fullName: profile.fullName }, req });
        res.json({ message: profile.featured ? 'Profile featured.' : 'Profile unfeatured.', featured: profile.featured });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── CURSOR: Reports ─────────────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const safePage = Math.max(Number(page) || 1, 1);
        const lim = safeLimit(limit, 20);
        const filter = {};
        if (status && status !== '') filter.status = status;
        else filter.$or = [{ status: 'pending' }, { status: null }, { status: { $exists: false } }];

        const skip = (safePage - 1) * lim;
        const [reports, total] = await Promise.all([
            Report.find(filter)
                .populate('reporterId', 'fullName email')
                .populate('reportedProfileId', 'fullName profileId profilePhotoUrl userId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(lim)
                .lean(),
            Report.countDocuments(filter)
        ]);

        res.json({ reports, total, page: safePage, pages: Math.ceil(total / lim) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/reports/:id/resolve', async (req, res) => {
    try {
        const report = await Report.findById(req.params.id).populate('reportedProfileId', 'userId');
        if (!report) return res.status(404).json({ message: 'Report not found.' });
        report.status = 'resolved';
        await report.save();

        const { createNotification } = require('../helpers/notifications');
        const profileUserId = report.reportedProfileId?.userId;
        if (profileUserId) {
            await createNotification(profileUserId, 'report_resolved', 'Your profile was reported. Please ensure it complies with our guidelines.', report._id);
        }
        await logAdminAction({ adminId: req.user._id, action: 'resolve_report', resource: 'report', resourceId: report._id, details: { reason: report.reason }, req });
        res.json({ message: 'Report resolved. User has been notified.', report });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/reports/:id/dismiss', async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found.' });
        report.status = 'dismissed';
        await report.save();
        await logAdminAction({ adminId: req.user._id, action: 'dismiss_report', resource: 'report', resourceId: report._id, details: { reason: report.reason }, req });
        res.json({ message: 'Report dismissed.', report });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── CURSOR: Export Orders CSV ───────────────────────────────────────────────
router.get('/export/orders', async (req, res) => {
    try {
        const { status, plan } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (plan) filter.plan = plan;
        const orders = await MembershipOrder.find(filter)
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .lean();
        const headers = ['Date', 'User', 'Email', 'Plan', 'Amount', 'Status'];
        const rows = orders.map(o => [
            o.createdAt ? new Date(o.createdAt).toISOString() : '',
            (o.userId?.fullName || '').replace(/,/g, ' '),
            (o.userId?.email || '').replace(/,/g, ' '),
            o.plan || '',
            o.amount ?? '',
            o.status || ''
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── CURSOR: Orders ──────────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, plan } = req.query;
        const safePage = Math.max(Number(page) || 1, 1);
        const lim = safeLimit(limit, 20);
        const filter = {};
        if (status) filter.status = status;
        if (plan) filter.plan = plan;

        const skip = (safePage - 1) * lim;
        const [orders, total] = await Promise.all([
            MembershipOrder.find(filter)
                .populate('userId', 'fullName email membershipTier')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(lim)
                .lean(),
            MembershipOrder.countDocuments(filter)
        ]);

        const revenueThisMonth = await MembershipOrder.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const revenueTotal = await MembershipOrder.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            orders,
            total,
            page: safePage,
            pages: Math.ceil(total / lim),
            revenueThisMonth: revenueThisMonth[0]?.total || 0,
            revenueTotal: revenueTotal[0]?.total || 0
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── CURSOR: Platform Settings ─────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
    try {
        let settings = await PlatformSettings.findById('platform');
        if (!settings) {
            settings = await PlatformSettings.create({ _id: 'platform' });
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/settings', async (req, res) => {
    try {
        const { maintenanceMode, maxPhotosPerUser, tierPricing } = req.body;
        let settings = await PlatformSettings.findById('platform');
        if (!settings) {
            settings = await PlatformSettings.create({ _id: 'platform' });
        }
        if (typeof maintenanceMode === 'boolean') settings.maintenanceMode = maintenanceMode;
        if (typeof maxPhotosPerUser === 'number' && maxPhotosPerUser >= 1 && maxPhotosPerUser <= 50) settings.maxPhotosPerUser = maxPhotosPerUser;
        if (Array.isArray(tierPricing)) settings.tierPricing = tierPricing;
        await settings.save();
        await logAdminAction({ adminId: req.user._id, action: 'update_settings', resource: 'platform', details: { maintenanceMode: settings.maintenanceMode, maxPhotosPerUser: settings.maxPhotosPerUser }, req });
        res.json({ message: 'Settings updated.', settings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── CURSOR: Platform Settings ─────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
    try {
        let settings = await PlatformSettings.findById('platform');
        if (!settings) {
            settings = await PlatformSettings.create({ _id: 'platform' });
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/settings', async (req, res) => {
    try {
        const { maintenanceMode, maxPhotosPerUser, tierPricing } = req.body;
        let settings = await PlatformSettings.findById('platform');
        if (!settings) {
            settings = await PlatformSettings.create({ _id: 'platform' });
        }
        if (typeof maintenanceMode === 'boolean') settings.maintenanceMode = maintenanceMode;
        if (typeof maxPhotosPerUser === 'number' && maxPhotosPerUser >= 1 && maxPhotosPerUser <= 50) settings.maxPhotosPerUser = maxPhotosPerUser;
        if (Array.isArray(tierPricing)) settings.tierPricing = tierPricing;
        await settings.save();
        await logAdminAction({ adminId: req.user._id, action: 'update_settings', resource: 'platform', details: { maintenanceMode: settings.maintenanceMode, maxPhotosPerUser: settings.maxPhotosPerUser }, req });
        res.json({ message: 'Settings updated.', settings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── CURSOR: Announcements ────────────────────────────────────────────────────
router.get('/announcements', async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
        res.json(announcements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/announcements', async (req, res) => {
    try {
        const { title, message, type, active, startDate, endDate } = req.body;
        if (!title || !message) return res.status(400).json({ message: 'Title and message required.' });
        const ann = await Announcement.create({
            title,
            message,
            type: type || 'info',
            active: active !== false,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        });
        await logAdminAction({ adminId: req.user._id, action: 'create_announcement', resource: 'announcement', resourceId: ann._id, details: { title }, req });
        res.status(201).json(ann);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/announcements/:id', async (req, res) => {
    try {
        const { title, message, type, active, startDate, endDate } = req.body;
        const ann = await Announcement.findById(req.params.id);
        if (!ann) return res.status(404).json({ message: 'Announcement not found.' });
        if (title !== undefined) ann.title = title;
        if (message !== undefined) ann.message = message;
        if (type !== undefined) ann.type = type;
        if (typeof active === 'boolean') ann.active = active;
        if (startDate !== undefined) ann.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) ann.endDate = endDate ? new Date(endDate) : null;
        await ann.save();
        await logAdminAction({ adminId: req.user._id, action: 'update_announcement', resource: 'announcement', resourceId: ann._id, details: { title: ann.title }, req });
        res.json(ann);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/announcements/:id', async (req, res) => {
    try {
        const ann = await Announcement.findByIdAndDelete(req.params.id);
        if (!ann) return res.status(404).json({ message: 'Announcement not found.' });
        await logAdminAction({ adminId: req.user._id, action: 'delete_announcement', resource: 'announcement', resourceId: ann._id, details: { title: ann.title }, req });
        res.json({ message: 'Announcement deleted.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── CURSOR: Announcements ────────────────────────────────────────────────────
router.get('/announcements', async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
        res.json(announcements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/announcements', async (req, res) => {
    try {
        const { title, message, type, active, startDate, endDate } = req.body;
        if (!title || !message) return res.status(400).json({ message: 'Title and message required.' });
        const ann = await Announcement.create({
            title,
            message,
            type: type || 'info',
            active: active !== false,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        });
        await logAdminAction({ adminId: req.user._id, action: 'create_announcement', resource: 'announcement', resourceId: ann._id, details: { title }, req });
        res.status(201).json(ann);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/announcements/:id', async (req, res) => {
    try {
        const { title, message, type, active, startDate, endDate } = req.body;
        const ann = await Announcement.findById(req.params.id);
        if (!ann) return res.status(404).json({ message: 'Announcement not found.' });
        if (title !== undefined) ann.title = title;
        if (message !== undefined) ann.message = message;
        if (type !== undefined) ann.type = type;
        if (typeof active === 'boolean') ann.active = active;
        if (startDate !== undefined) ann.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) ann.endDate = endDate ? new Date(endDate) : null;
        await ann.save();
        await logAdminAction({ adminId: req.user._id, action: 'update_announcement', resource: 'announcement', resourceId: ann._id, details: { title: ann.title }, req });
        res.json(ann);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/announcements/:id', async (req, res) => {
    try {
        const ann = await Announcement.findByIdAndDelete(req.params.id);
        if (!ann) return res.status(404).json({ message: 'Announcement not found.' });
        await logAdminAction({ adminId: req.user._id, action: 'delete_announcement', resource: 'announcement', resourceId: ann._id, details: { title: ann.title }, req });
        res.json({ message: 'Announcement deleted.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── CURSOR: Admin Audit Log ──────────────────────────────────────────────────
router.get('/audit-log', async (req, res) => {
    try {
        const { page = 1, limit = 50, action, adminId, fromDate, toDate } = req.query;
        const safePage = Math.max(Number(page) || 1, 1);
        const lim = safeLimit(limit, 50);
        const filter = {};
        if (action) filter.action = action;
        if (adminId) filter.adminId = adminId;
        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        const skip = (safePage - 1) * lim;
        const [logs, total] = await Promise.all([
            AdminAuditLog.find(filter)
                .populate('adminId', 'fullName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(lim)
                .lean(),
            AdminAuditLog.countDocuments(filter)
        ]);

        res.json({ logs, total, page: safePage, pages: Math.ceil(total / lim) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── CURSOR: Interests ───────────────────────────────────────────────────────
router.get('/interests', async (req, res) => {
    try {
        const { page = 1, limit = 30, status, fromDate, toDate } = req.query;
        const safePage = Math.max(Number(page) || 1, 1);
        const lim = safeLimit(limit, 30);
        const filter = {};
        if (status) filter.status = status;
        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        const skip = (safePage - 1) * lim;
        const [interests, total] = await Promise.all([
            Interest.find(filter)
                .populate('fromUserId', 'fullName email')
                .populate('toProfileId', 'fullName profileId profilePhotoUrl userId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(lim)
                .lean(),
            Interest.countDocuments(filter)
        ]);

        res.json({ interests, total, page: safePage, pages: Math.ceil(total / lim) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/export/users ───────────────────────────────────────────
router.get('/export/users', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }).lean();
        const profiles = await Profile.find({ userId: { $in: users.map(u => u._id) } }).select('userId profileId').lean();
        const pMap = {};
        profiles.forEach(p => { pMap[p.userId.toString()] = p.profileId; });

        let csv = 'ID,Name,Email,Tier,Verified,Suspended,ProfileID,Joined\n';
        users.forEach(u => {
            const row = [
                u._id,
                `"${u.fullName || ''}"`,
                u.email,
                u.membershipTier,
                u.verified,
                u.isSuspended,
                pMap[u._id.toString()] || '',
                u.createdAt.toISOString()
            ];
            csv += row.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/export/profiles ────────────────────────────────────────
router.get('/export/profiles', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('userId', 'email membershipTier').sort({ createdAt: -1 }).lean();
        let csv = 'ID,ProfileID,Name,Gender,Email,Tier,Status,Featured,Joined\n';
        profiles.forEach(p => {
            const row = [
                p._id,
                p.profileId || '',
                `"${p.fullName || ''}"`,
                p.gender || '',
                p.userId?.email || '',
                p.userId?.membershipTier || 'bronze',
                p.isActive === false ? 'Inactive' : 'Active',
                p.featured ? 'Yes' : 'No',
                p.createdAt.toISOString()
            ];
            csv += row.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=profiles.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/conversations ───────────────────────────────────────────
router.get('/conversations', async (req, res) => {
    try {
        const { page = 1, limit = 20, userId } = req.query;
        const safePage = Math.max(Number(page) || 1, 1);
        const lim = safeLimit(limit, 20);
        const filter = {};
        if (userId) {
            filter.participants = userId;
        }

        const skip = (safePage - 1) * lim;
        const [conversations, total] = await Promise.all([
            Conversation.find(filter)
                .populate('participants', 'fullName email')
                .sort({ lastMessageAt: -1 })
                .skip(skip)
                .limit(lim)
                .lean(),
            Conversation.countDocuments(filter)
        ]);

        res.json({ conversations, total, page: safePage, pages: Math.ceil(total / lim) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/conversations/:id/messages ──────────────────────────────
router.get('/conversations/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const conversation = await Conversation.findById(id).populate('participants', 'fullName email');
        if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

        const messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 }).lean();

        // Audit this sensitive action
        const participants = conversation.participants.map(p => p.email).join(', ');
        await logAdminAction({
            adminId: req.user._id,
            action: 'view_conversation',
            resource: 'conversation',
            resourceId: id,
            details: { participants },
            req
        });

        res.json({ conversation, messages });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /api/admin/impersonate/:userId ────────────────────────────────────
router.post('/impersonate/:userId', async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.userId);
        if (!targetUser) return res.status(404).json({ message: 'User not found.' });
        if (targetUser.isAdmin) return res.status(403).json({ message: 'Cannot impersonate an administrator.' });

        const token = generateToken(targetUser._id);

        await logAdminAction({
            adminId: req.user._id,
            action: 'impersonate_user',
            resource: 'user',
            resourceId: targetUser._id,
            details: { email: targetUser.email, fullName: targetUser.fullName },
            req
        });

        res.json({
            token,
            user: {
                id: targetUser._id,
                email: targetUser.email,
                fullName: targetUser.fullName,
                gender: targetUser.gender,
                membershipTier: targetUser.membershipTier,
                verified: targetUser.verified,
                isAdmin: targetUser.isAdmin,
                isSuspended: targetUser.isSuspended,
                isImpersonated: true
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
