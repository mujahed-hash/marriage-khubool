const mongoose = require('mongoose');

const membershipOrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plan: {
        type: String,
        enum: ['silver', 'gold', 'diamond', 'crown'],
        required: true
    },
    amount: { type: Number, required: true },
    duration: { type: String, default: '1 month' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('MembershipOrder', membershipOrderSchema);
