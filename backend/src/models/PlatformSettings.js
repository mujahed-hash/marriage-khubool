const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
    _id: { type: String, default: 'platform' },
    maintenanceMode: { type: Boolean, default: false },
    maxPhotosPerUser: { type: Number, default: 10 },
    tierPricing: [{
        tier: { type: String, enum: ['silver', 'gold', 'diamond', 'crown'] },
        amount: { type: Number },
        duration: { type: String, default: '1 month' }
    }]
}, { timestamps: true });

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
