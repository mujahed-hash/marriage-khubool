const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['interest_received', 'interest_accepted', 'profile_visited', 'message_received'],
        required: true
    },
    message: { type: String, required: true },
    relatedId: mongoose.Schema.Types.ObjectId,
    read: { type: Boolean, default: false },
    metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
