const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    notifications: {
        emailOnInterest: { type: Boolean, default: true },
        emailOnVisitor: { type: Boolean, default: true },
        emailOnShortlist: { type: Boolean, default: false }
    },
    privacy: {
        showContactInfo: { type: Boolean, default: true },
        showLastSeen: { type: Boolean, default: true },
        profileVisibility: { type: String, enum: ['everyone', 'members', 'premium'], default: 'everyone' }
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
