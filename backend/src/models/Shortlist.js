const mongoose = require('mongoose');

const shortlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
}, { timestamps: true });

shortlistSchema.index({ userId: 1, profileId: 1 }, { unique: true });

module.exports = mongoose.model('Shortlist', shortlistSchema);
