const mongoose = require('mongoose');

const profileVisitorSchema = new mongoose.Schema({
    viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    viewedAt: { type: Date, default: Date.now }
}, { timestamps: true });

profileVisitorSchema.index({ profileId: 1, viewedAt: -1 });
profileVisitorSchema.index({ viewerId: 1, profileId: 1 });

module.exports = mongoose.model('ProfileVisitor', profileVisitorSchema);
