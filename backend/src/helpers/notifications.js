const Notification = require('../models/Notification');

/**
 * Create a notification for a user. Call from interest, visitor, chat routes.
 * @param {ObjectId} userId - User to notify
 * @param {string} type - interest_received | interest_accepted | profile_visited | message_received
 * @param {string} message - Display message
 * @param {ObjectId} [relatedId] - Optional related profile/interest/message id
 */
async function createNotification(userId, type, message, relatedId = null) {
    try {
        await Notification.create({ userId, type, message, relatedId });
    } catch (err) {
        console.error('Failed to create notification:', err.message);
    }
}

module.exports = { createNotification };
