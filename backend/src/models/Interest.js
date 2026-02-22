const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema({
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

interestSchema.index({ fromUserId: 1, toProfileId: 1 }, { unique: true });

module.exports = mongoose.model('Interest', interestSchema);
