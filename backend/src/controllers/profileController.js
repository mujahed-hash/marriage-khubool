const path = require('path');
const fs = require('fs');
const Profile = require('../models/Profile');
const Photo = require('../models/Photo');
const User = require('../models/User');
const sampleProfile = require('../data/sampleProfile');
const { resolveProfileById } = require('../helpers/profiles');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

exports.createOrUpdate = async (req, res) => {
    try {
        const userId = req.user.id;
        let profile = await Profile.findOne({ userId });
        const data = { ...req.body, userId };
        if (profile) {
            profile = await Profile.findOneAndUpdate(
                { userId },
                { $set: data },
                { new: true, runValidators: true }
            );
        } else {
            profile = await Profile.create(data);
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id })
            .populate('userId', 'fullName email membershipTier verified');
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found. Create your profile first.' });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProfileById = async (req, res) => {
    try {
        const profile = await resolveProfileById(req.params.id);
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }
        const populated = await Profile.findById(profile._id)
            .populate('userId', 'fullName email membershipTier verified');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSampleProfile = async (req, res) => {
    try {
        res.json(sampleProfile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteMyProfile = async (req, res) => {
    try {
        const profile = await Profile.findOneAndDelete({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }
        res.json({ message: 'Profile deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyPhotos = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const profile = await Profile.findOne({ userId });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }
        const photos = await Photo.find({ profileId: profile._id }).sort({ order: 1, createdAt: 1 });
        res.json({ photos });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadPhoto = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const profile = await Profile.findOne({ userId });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }
        if (!req.file || !req.file.path) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        const url = '/uploads/' + path.basename(req.file.path);
        const count = await Photo.countDocuments({ profileId: profile._id });
        const setPrimary = req.query.primary === 'true';
        const photo = await Photo.create({
            profileId: profile._id,
            url,
            order: count,
            isPrimary: count === 0 || setPrimary
        });
        if (count === 0 || setPrimary) {
            await Photo.updateMany({ profileId: profile._id, _id: { $ne: photo._id } }, { isPrimary: false });
            await Profile.findByIdAndUpdate(profile._id, { profilePhotoUrl: url });
        }
        res.status(201).json(photo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePhoto = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });
        const photo = await Photo.findOne({ _id: req.params.photoId, profileId: profile._id });
        if (!photo) return res.status(404).json({ message: 'Photo not found.' });
        await Photo.findByIdAndDelete(photo._id);
        if (profile.profilePhotoUrl === photo.url) {
            const next = await Photo.findOne({ profileId: profile._id }).sort({ order: 1 });
            await Profile.findByIdAndUpdate(profile._id, { profilePhotoUrl: next?.url || null });
        }
        res.json({ message: 'Photo deleted.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.setPrimaryPhoto = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }
        const photo = await Photo.findOne({ _id: req.params.photoId, profileId: profile._id });
        if (!photo) {
            return res.status(404).json({ message: 'Photo not found.' });
        }
        await Photo.updateMany({ profileId: profile._id }, { isPrimary: false });
        await Photo.findByIdAndUpdate(photo._id, { isPrimary: true });
        await Profile.findByIdAndUpdate(profile._id, { profilePhotoUrl: photo.url });
        res.json({ message: 'Profile photo updated.', url: photo.url });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProfiles = async (req, res) => {
    try {
        const { tier, search, state, gender, page = 1, limit = 20 } = req.query;
        const query = {};
        if (tier) query.membershipTier = tier;
        if (state) query.state = state;
        if (gender) query.gender = gender;

        // When logged in: show only opposite gender (male sees female, female sees male)
        if (req.user) {
            const myProfile = await Profile.findOne({ userId: req.user._id }).select('gender');
            if (myProfile?.gender) {
                const opposite = myProfile.gender.toLowerCase() === 'male' ? 'female' : 'male';
                query.gender = opposite;
            }
        }
        if (search) {
            query.$or = [
                { fullName: new RegExp(search, 'i') },
                { city: new RegExp(search, 'i') },
                { state: new RegExp(search, 'i') },
                { occupation: new RegExp(search, 'i') }
            ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const profiles = await Profile.find(query)
            .select('fullName profileId profilePhotoUrl dateOfBirth height occupation city state membershipTier gender')
            .limit(parseInt(limit))
            .skip(skip)
            .sort({ createdAt: -1 });
        const total = await Profile.countDocuments(query);
        res.json({ profiles, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
