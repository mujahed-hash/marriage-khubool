const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    profileId: {
        type: String,
        unique: true
    },
    // Basic Details
    fullName: String,
    gender: String,
    dateOfBirth: String,
    height: String,
    motherTongue: String,
    maritalStatus: String,
    // Religious & Cultural
    religion: String,
    caste: String,
    gothra: String,
    manglik: String,
    visitDarghaFateha: String,
    // Location
    country: { type: String, default: 'India' },
    state: String,
    district: String,
    city: String,
    locality: String,
    pinCode: String,
    nativePlace: String,
    // Education & Career
    highestEducation: String,
    degree: String,
    occupation: String,
    company: String,
    monthlyIncome: String,
    placeOfOccupation: String,
    // Family
    fatherStatus: String,
    motherStatus: String,
    siblings: String,
    familyType: String,
    familyValues: String,
    fatherName: String,
    fatherOccupation: String,
    motherName: String,
    motherOccupation: String,
    // Lifestyle
    diet: String,
    smoking: String,
    drinking: String,
    hobbies: [String],
    bio: String,
    complexion: String,
    // Contact (stored for display to matched users)
    email: String,
    contactNo: String,
    alternateNo: String,
    // Media
    profilePhotoUrl: String,
    verificationDocUrl: String,
    photoPrivacy: {
        type: String,
        enum: ['visible', 'on_request', 'hidden'],
        default: 'visible'
    },
    // Membership tier for display
    membershipTier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'diamond', 'crown'],
        default: 'bronze'
    },
    // Phase 5: Partner Preferences
    partnerPreferences: {
        ageRange: {
            min: { type: Number, min: 18, max: 99 },
            max: { type: Number, min: 18, max: 99 }
        },
        heightRange: {
            min: String,
            max: String
        },
        maritalStatus: [String],
        religion: [String],
        motherTongue: [String],
        diet: [String],
        country: [String],
        state: [String],
        city: String,
        complexion: [String],
        annualIncome: String
    },
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Compound indexes for list/search queries
profileSchema.index({ isActive: 1, membershipTier: 1, featured: -1, createdAt: -1 });
profileSchema.index({ isActive: 1, gender: 1, state: 1, createdAt: -1 });

// Generate profile ID before save
profileSchema.pre('save', function (next) {
    if (!this.profileId) {
        this.profileId = 'KH' + Date.now().toString(36).toUpperCase();
    }
    next();
});

module.exports = mongoose.model('Profile', profileSchema);
