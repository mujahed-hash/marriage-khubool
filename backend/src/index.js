require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profiles');
const shortlistRoutes = require('./routes/shortlist');
const interestRoutes = require('./routes/interest');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const blockRoutes = require('./routes/block');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const platformRoutes = require('./routes/platform');

// Cursor routes (may or may not exist yet)
let notificationsRoutes, matchRoutes, membershipRoutes;
try { notificationsRoutes = require('./routes/notifications'); } catch { notificationsRoutes = null; }
try { matchRoutes = require('./routes/match'); } catch { matchRoutes = null; }
try { membershipRoutes = require('./routes/membership'); } catch { membershipRoutes = null; }

connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:4200', 'http://localhost:4400', 'http://127.0.0.1:4200', 'http://127.0.0.1:4400', 'http://localhost:4401', 'http://127.0.0.1:4401', 'https://khuboolhai.com', 'https://www.khuboolhai.com', 'https://admin.khuboolhai.com'],
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors({ origin: ['http://localhost:4200', 'http://localhost:4400', 'http://127.0.0.1:4200', 'http://127.0.0.1:4400', 'http://localhost:4401', 'http://127.0.0.1:4401', 'https://khuboolhai.com', 'https://www.khuboolhai.com', 'https://admin.khuboolhai.com'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/shortlist', shortlistRoutes);
app.use('/api/interest', interestRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/block', blockRoutes);
app.use('/api/chat', chatRoutes);
if (notificationsRoutes) app.use('/api/notifications', notificationsRoutes);
if (matchRoutes) app.use('/api/match', matchRoutes);
if (membershipRoutes) app.use('/api/membership', membershipRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/platform', platformRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Khubool Hai API is running' });
});

// ── Socket.io Chat Events ──
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

io.on('connection', (socket) => {
    // Authenticate socket
    const token = socket.handshake.auth?.token;
    if (!token) return socket.disconnect();

    let userId;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id || decoded._id;
    } catch {
        return socket.disconnect();
    }

    // Track online status
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Join personal room
    socket.join(`user:${userId}`);

    // Join conversation rooms for this user
    socket.on('joinConversation', (conversationId) => {
        socket.join(`conv:${conversationId}`);
    });

    // Handle sending message
    socket.on('sendMessage', async ({ conversationId, text }) => {
        if (!text?.trim() || !conversationId) return;

        try {
            const conv = await Conversation.findById(conversationId);
            if (!conv || !conv.participants.some(p => p.toString() === userId)) return;

            const message = await Message.create({
                conversationId,
                senderId: userId,
                text: text.trim()
            });

            conv.lastMessage = text.trim().substring(0, 100);
            conv.lastMessageAt = new Date();
            await conv.save();

            // Emit to all participants in the conversation room
            io.to(`conv:${conversationId}`).emit('newMessage', {
                _id: message._id,
                conversationId,
                senderId: userId,
                text: message.text,
                read: false,
                createdAt: message.createdAt
            });

            // Notify other participant if not in the conversation room
            const otherUserId = conv.participants.find(p => p.toString() !== userId);
            if (otherUserId) {
                io.to(`user:${otherUserId}`).emit('messageNotification', {
                    conversationId,
                    text: text.trim().substring(0, 50)
                });
            }
        } catch (err) {
            socket.emit('error', { message: 'Failed to send message.' });
        }
    });

    // Typing indicator
    socket.on('typing', ({ conversationId }) => {
        socket.to(`conv:${conversationId}`).emit('userTyping', { userId, conversationId });
    });

    socket.on('stopTyping', ({ conversationId }) => {
        socket.to(`conv:${conversationId}`).emit('userStoppedTyping', { userId, conversationId });
    });

    socket.on('disconnect', () => {
        if (onlineUsers.has(userId)) {
            onlineUsers.get(userId).delete(socket.id);
            if (onlineUsers.get(userId).size === 0) onlineUsers.delete(userId);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (with Socket.io)`);
});

