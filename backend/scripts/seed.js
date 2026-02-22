#!/usr/bin/env node
/**
 * Seed script - populates MongoDB with dummy users and profiles for testing
 * Run: node scripts/seed.js (from backend directory)
 * Or: npm run seed
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const sampleProfile = require('../src/data/sampleProfile');

const SAMPLE_USERS = [
    { email: 'test1@example.com', password: 'password123', fullName: 'Mohammed Ahmed Khan', gender: 'male', membershipTier: 'diamond' },
    { email: 'test2@example.com', password: 'password123', fullName: 'Sana Khan', gender: 'female', membershipTier: 'diamond' },
    { email: 'test3@example.com', password: 'password123', fullName: 'Abdullah Khan', gender: 'male', membershipTier: 'gold' },
    { email: 'test4@example.com', password: 'password123', fullName: 'Fatima Khan', gender: 'female', membershipTier: 'gold' },
    { email: 'test5@example.com', password: 'password123', fullName: 'Ibrahim Khan', gender: 'male', membershipTier: 'bronze' }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marriage');
        console.log('MongoDB connected for seeding');

        // Clear existing users and profiles (optional - comment out to preserve data)
        await Profile.deleteMany({});
        await User.deleteMany({});

        const createdUsers = [];
        for (const u of SAMPLE_USERS) {
            const user = await User.create({
                email: u.email,
                password: u.password,
                fullName: u.fullName,
                gender: u.gender,
                membershipTier: u.membershipTier
            });
            createdUsers.push({ ...user.toObject(), plainPassword: u.password });
        }

        // Create profiles for each user
        const profileVariants = [
            { ...sampleProfile, fullName: 'Mohammed Ahmed Khan', gender: 'male', membershipTier: 'diamond' },
            { ...sampleProfile, fullName: 'Sana Khan', gender: 'female', membershipTier: 'diamond', occupation: 'Teacher' },
            { ...sampleProfile, fullName: 'Abdullah Khan', gender: 'male', membershipTier: 'gold', city: 'Hyderabad' },
            { ...sampleProfile, fullName: 'Fatima Khan', gender: 'female', membershipTier: 'gold', occupation: 'Doctor' },
            { ...sampleProfile, fullName: 'Ibrahim Khan', gender: 'male', membershipTier: 'bronze' }
        ];

        for (let i = 0; i < createdUsers.length; i++) {
            const user = createdUsers[i];
            const profileData = { ...profileVariants[i], userId: user._id, profileId: `KH${Date.now()}${i}` };
            delete profileData._id;
            await Profile.create(profileData);
        }

        console.log(`Seeded ${createdUsers.length} users and profiles`);
        console.log('Test users (email / password):');
        createdUsers.forEach(u => console.log(`  ${u.email} / ${u.plainPassword}`));
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

seed();
