const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true
    },
    url: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        default: 0
    },
    isPrimary: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Photo', photoSchema);
