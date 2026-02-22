const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const MembershipOrder = require('../models/MembershipOrder');

const router = express.Router();

// Plan config: plan -> { amount, duration }
const PLANS = {
    silver: { 299: '1 month', 569: '2 months', 799: '3 months', 1299: '6 months' },
    gold: { 499: '1 month', 949: '2 months', 1299: '3 months', 2299: '6 months' },
    diamond: { 699: '1 month', 1299: '2 months', 1799: '3 months', 2999: '6 months' },
    crown: { 9999: 'lifetime' }
};

router.use(protect);

// POST /api/membership/order – create order (returns orderId for Razorpay checkout)
router.post('/order', async (req, res) => {
    try {
        const { plan, amount } = req.body;
        if (!plan || !amount) {
            return res.status(400).json({ message: 'Plan and amount required.' });
        }
        const planConfig = PLANS[plan];
        if (!planConfig || !planConfig[Number(amount)]) {
            return res.status(400).json({ message: 'Invalid plan or amount.' });
        }
        const duration = planConfig[Number(amount)];

        let razorpayOrderId = `test_order_${Date.now()}`;
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
            try {
                const Razorpay = require('razorpay');
                const rzp = new Razorpay({
                    key_id: process.env.RAZORPAY_KEY_ID,
                    key_secret: process.env.RAZORPAY_KEY_SECRET
                });
                const order = await rzp.orders.create({
                    amount: amount * 100,
                    currency: 'INR',
                    receipt: `membership_${plan}_${Date.now()}`
                });
                razorpayOrderId = order.id;
            } catch (e) {
                console.warn('Razorpay order creation failed, using test order:', e.message);
            }
        }

        const order = await MembershipOrder.create({
            userId: req.user._id,
            plan,
            amount: Number(amount),
            duration,
            razorpayOrderId,
            status: 'pending'
        });

        res.json({
            orderId: razorpayOrderId,
            membershipOrderId: order._id,
            amount,
            plan,
            keyId: process.env.RAZORPAY_KEY_ID || null
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create order.', error: err.message });
    }
});

// POST /api/membership/verify – verify payment and upgrade tier
router.post('/verify', async (req, res) => {
    try {
        const { membershipOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        if (!membershipOrderId) {
            return res.status(400).json({ message: 'membershipOrderId required.' });
        }

        const order = await MembershipOrder.findOne({
            _id: membershipOrderId,
            userId: req.user._id,
            status: 'pending'
        });
        if (!order) {
            return res.status(404).json({ message: 'Order not found or already processed.' });
        }

        // If Razorpay is configured, verify signature
        if (process.env.RAZORPAY_KEY_SECRET && razorpayPaymentId && razorpaySignature) {
            const crypto = require('crypto');
            const body = order.razorpayOrderId + '|' + razorpayPaymentId;
            const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
            if (expected !== razorpaySignature) {
                return res.status(400).json({ message: 'Payment verification failed.' });
            }
        }

        order.status = 'completed';
        order.razorpayPaymentId = razorpayPaymentId || 'test';
        order.razorpaySignature = razorpaySignature || 'test';
        await order.save();

        await User.findByIdAndUpdate(req.user._id, { membershipTier: order.plan });
        await Profile.findOneAndUpdate({ userId: req.user._id }, { membershipTier: order.plan });

        res.json({ message: 'Payment verified. Membership upgraded.', tier: order.plan });
    } catch (err) {
        res.status(500).json({ message: 'Failed to verify payment.', error: err.message });
    }
});

module.exports = router;
