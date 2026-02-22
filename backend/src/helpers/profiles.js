const mongoose = require('mongoose');
const Profile = require('../models/Profile');

/** Check if string is a valid MongoDB ObjectId (24 hex chars) */
function isValidObjectId(id) {
    return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

/**
 * Resolve a profile by id - accepts either MongoDB _id or custom profileId string.
 * Returns the Profile document or null.
 * Note: Querying _id with non-ObjectId string (e.g. "KH123") causes Mongoose CastError.
 */
async function resolveProfileById(id) {
    if (!id) return null;
    const conditions = [{ profileId: id }];
    if (isValidObjectId(id)) {
        conditions.push({ _id: new mongoose.Types.ObjectId(id) });
    }
    return Profile.findOne({ $or: conditions });
}

module.exports = { resolveProfileById };
