const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');

async function seedAdmin() {
    try {
        await connectDB();

        const email = 'admin@khubool.com';
        const password = 'adminPassword123';
        const fullName = 'System Administrator';

        let user = await User.findOne({ email });

        if (user) {
            user.isAdmin = true;
            user.fullName = fullName;
            user.password = password;
            await user.save();
            console.log('Admin user updated successfully.');
        } else {
            user = new User({
                email,
                password,
                fullName,
                isAdmin: true,
                verified: true
            });
            await user.save();
            console.log('Admin user created successfully.');
        }

        console.log('-----------------------------------');
        console.log('Admin URL: http://localhost:4401');
        console.log('Email: ' + email);
        console.log('Password: ' + password);
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
