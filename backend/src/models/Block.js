const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
    blockerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    blockedProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true }
}, { timestamps: true });

blockSchema.index({ blockerId: 1, blockedProfileId: 1 }, { unique: true });

module.exports = mongoose.model('Block', blockSchema);
