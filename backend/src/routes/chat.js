const express = require('express');
const { protect } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Profile = require('../models/Profile');
const { createNotification } = require('../helpers/notifications');
const { resolveProfileById } = require('../helpers/profiles');

const router = express.Router();

// GET /api/chat/conversations – list user's conversations with last message & participant profile
router.get('/conversations', protect, async (req, res) => {
    try {
        const conversations = await Conversation.find({ participants: req.user._id })
            .sort({ lastMessageAt: -1 })
            .lean();

        const enriched = [];
        for (const c of conversations) {
            const otherUserId = c.participants.find(p => p.toString() !== req.user._id.toString());
            const otherProfile = await Profile.findOne({ userId: otherUserId })
                .select('fullName profileId profilePhotoUrl gender city')
                .lean();
            // Count unread messages
            const unreadCount = await Message.countDocuments({
                conversationId: c._id,
                senderId: { $ne: req.user._id },
                read: false
            });
            enriched.push({
                _id: c._id,
                otherUser: otherProfile || { fullName: 'Unknown' },
                lastMessage: c.lastMessage,
                lastMessageAt: c.lastMessageAt,
                unreadCount
            });
        }
        res.json({ conversations: enriched });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch conversations.', error: err.message });
    }
});

// POST /api/chat/conversations – start or get existing conversation with a user
router.post('/conversations', protect, async (req, res) => {
    try {
        const { profileId } = req.body;
        if (!profileId) return res.status(400).json({ message: 'profileId is required.' });

        const profile = await resolveProfileById(profileId);
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });

        const otherUserId = profile.userId;
        if (otherUserId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot chat with yourself.' });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user._id, otherUserId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [req.user._id, otherUserId]
            });
        }

        res.json({ conversationId: conversation._id });
    } catch (err) {
        res.status(500).json({ message: 'Failed to start conversation.', error: err.message });
    }
});

// GET /api/chat/conversations/:id/messages – get messages for a conversation
router.get('/conversations/:id/messages', protect, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

        // Check user is participant
        if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const messages = await Message.find({ conversationId: req.params.id })
            .sort({ createdAt: 1 })
            .lean();

        // Mark messages as read
        await Message.updateMany(
            { conversationId: req.params.id, senderId: { $ne: req.user._id }, read: false },
            { $set: { read: true } }
        );

        res.json({ messages });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch messages.', error: err.message });
    }
});

// POST /api/chat/conversations/:id/messages – send a message (REST fallback)
router.post('/conversations/:id/messages', protect, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

        if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: 'Message text required.' });

        const message = await Message.create({
            conversationId: req.params.id,
            senderId: req.user._id,
            text: text.trim()
        });

        conversation.lastMessage = text.trim().substring(0, 100);
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const recipientId = conversation.participants.find(p => p.toString() !== req.user._id.toString());
        const senderName = req.user.fullName || 'Someone';
        await createNotification(
            recipientId,
            'message_received',
            `${senderName} sent you a message`,
            message._id
        );

        res.status(201).json({ message });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send message.', error: err.message });
    }
});

module.exports = router;
