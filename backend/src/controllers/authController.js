const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password, fullName, gender } = req.body;
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: 'Email already registered.' });
        }
        const user = await User.create({ email, password, fullName, gender });
        const token = generateToken(user._id);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                gender: user.gender,
                membershipTier: user.membershipTier,
                verified: user.verified,
                isAdmin: user.isAdmin,
                isSuspended: user.isSuspended
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        const token = generateToken(user._id);
        user.password = undefined;
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                gender: user.gender,
                membershipTier: user.membershipTier,
                verified: user.verified,
                isAdmin: user.isAdmin,
                isSuspended: user.isSuspended
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const obj = user.toObject();
        obj.id = obj._id.toString();
        res.json(obj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
