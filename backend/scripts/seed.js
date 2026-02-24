/**
 * Seed Script: Creates 100 realistic Indian matrimony profiles.
 * Usage: node backend/scripts/seed.js
 * 
 * Creates:
 *   - 100 User documents (hashed passwords via bcrypt)
 *   - 100 Profile documents with realistic data
 *   - backend/scripts/seed-credentials.md with all logins
 *
 * Distribution:
 *   - ~40 from Hyderabad/Telangana, ~60 from other states
 *   - 50 male / 50 female
 *   - Tiers: 20 Bronze, 25 Silver, 25 Gold, 15 Diamond, 15 Crown
 *   - Religions: Hindu, Muslim, Christian, Sikh
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const User = require('../src/models/User');
const Profile = require('../src/models/Profile');

// ─── DATA POOLS ─────────────────────────────────────────────────────────────

const maleNames = [
    'Arjun Reddy', 'Mohammed Irfan', 'Rahul Sharma', 'Vikram Singh', 'Aditya Kumar',
    'Suresh Babu', 'Ravi Teja', 'Kiran Kumar', 'Sanjay Mehta', 'Pradeep Nair',
    'Deepak Gupta', 'Anand Mishra', 'Kartik Pillai', 'Nikhil Joshi', 'Harish Rao',
    'Venkat Reddy', 'Imran Khan', 'Rohit Verma', 'Manoj Pandey', 'Siddharth Patel',
    'Arun Krishnan', 'Tarun Bhatia', 'Naveen Kumar', 'Rajeev Nambiar', 'Gaurav Agarwal',
    'Farhan Ansari', 'Pranav Sharma', 'Sachin Iyer', 'Ashok Yadav', 'Ajay Tiwari',
    'Lakshman Rao', 'Sandeep Choudhary', 'Varun Menon', 'Prakash Patil', 'Sunil Jain',
    'Akhil Krishna', 'Faisal Ahmed', 'Rakesh Nair', 'Dinesh Kumar', 'Vishal Gupta',
    'Rajesh Pandey', 'Mahesh Babu', 'Sameer Khan', 'Ankit Sharma', 'Kunal Singh',
    'Srinivas Rao', 'Yusuf Ali', 'Gopal Rao', 'Pavan Kumar', 'Chetan Dev',
];

const femaleNames = [
    'Priya Reddy', 'Ayesha Sultana', 'Divya Sharma', 'Sunita Singh', 'Pooja Kumari',
    'Lakshmi Devi', 'Meena Nair', 'Fatima Begum', 'Ananya Roy', 'Deepa Pillai',
    'Rekha Gupta', 'Kavya Mishra', 'Swathi Rao', 'Anjali Mehta', 'Nandini Krishnan',
    'Zara Ahmed', 'Gayatri Sharma', 'Pavithra Iyer', 'Shalini Joshi', 'Rukhsar Khan',
    'Bhavana Reddy', 'Sonia Verma', 'Amrutha Nambiar', 'Harini Patel', 'Sneha Yadav',
    'Nasreen Banu', 'Archana Bhatia', 'Vinitha Pillai', 'Lavanya Kumar', 'Shreya Agarwal',
    'Asmita Tiwari', 'Ramya Pandey', 'Sajida Begum', 'Neha Sharma', 'Anu Thomas',
    'Manisha Choudhary', 'Farzana Khan', 'Chandana Patil', 'Ritu Mehta', 'Sowmya Rao',
    'Preeti Nair', 'Hamida Shaikh', 'Saritha Menon', 'Nithya Kumar', 'Pallavi Gupta',
    'Saira Banu', 'Sudha Sharma', 'Mridula Singh', 'Keerthana Rao', 'Yamini Jain',
];

const tiers = [
    ...Array(20).fill('bronze'),
    ...Array(25).fill('silver'),
    ...Array(25).fill('gold'),
    ...Array(15).fill('diamond'),
    ...Array(15).fill('crown'),
];

const locations = [
    // Hyderabad / Telangana (~40)
    { state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad' },
    { state: 'Telangana', district: 'Hyderabad', city: 'Secunderabad' },
    { state: 'Telangana', district: 'Hyderabad', city: 'Banjara Hills' },
    { state: 'Telangana', district: 'Hyderabad', city: 'Jubilee Hills' },
    { state: 'Telangana', district: 'Hyderabad', city: 'Kukatpally' },
    { state: 'Telangana', district: 'Rangareddy', city: 'LB Nagar' },
    { state: 'Telangana', district: 'Medchal', city: 'Kompally' },
    { state: 'Telangana', district: 'Warangal', city: 'Warangal' },
    // Other States (~60)
    { state: 'Andhra Pradesh', district: 'Visakhapatnam', city: 'Visakhapatnam' },
    { state: 'Andhra Pradesh', district: 'Vijayawada', city: 'Vijayawada' },
    { state: 'Maharashtra', district: 'Mumbai', city: 'Mumbai' },
    { state: 'Maharashtra', district: 'Pune', city: 'Pune' },
    { state: 'Maharashtra', district: 'Nagpur', city: 'Nagpur' },
    { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai' },
    { state: 'Tamil Nadu', district: 'Coimbatore', city: 'Coimbatore' },
    { state: 'Karnataka', district: 'Bengaluru Urban', city: 'Bengaluru' },
    { state: 'Karnataka', district: 'Mysuru', city: 'Mysuru' },
    { state: 'Kerala', district: 'Ernakulam', city: 'Kochi' },
    { state: 'Kerala', district: 'Thiruvananthapuram', city: 'Thiruvananthapuram' },
    { state: 'Delhi', district: 'New Delhi', city: 'New Delhi' },
    { state: 'Uttar Pradesh', district: 'Lucknow', city: 'Lucknow' },
    { state: 'Uttar Pradesh', district: 'Agra', city: 'Agra' },
    { state: 'Punjab', district: 'Ludhiana', city: 'Ludhiana' },
    { state: 'Punjab', district: 'Amritsar', city: 'Amritsar' },
    { state: 'Rajasthan', district: 'Jaipur', city: 'Jaipur' },
    { state: 'Gujarat', district: 'Ahmedabad', city: 'Ahmedabad' },
    { state: 'West Bengal', district: 'Kolkata', city: 'Kolkata' },
];

// Map state -> likely religion mix for realism
const stateReligionMap = {
    'Punjab': ['Sikh', 'Hindu'],
    'Kerala': ['Hindu', 'Christian', 'Muslim'],
    'Telangana': ['Hindu', 'Muslim', 'Hindu', 'Hindu'],
    'Andhra Pradesh': ['Hindu', 'Muslim', 'Christian', 'Hindu'],
    'Tamil Nadu': ['Hindu', 'Christian', 'Hindu'],
    'default': ['Hindu', 'Muslim', 'Hindu', 'Hindu', 'Christian', 'Hindu'],
};

const religions = {
    Hindu: { castes: ['Brahmin', 'Kshatriya', 'Reddy', 'Naidu', 'Kamma', 'Vaisya', 'Kapu', 'Balija'], languages: ['Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam'] },
    Muslim: { castes: ['Syed', 'Sheikh', 'Pathan', 'Mughal', 'Ansari'], languages: ['Urdu', 'Telugu', 'Hindi'] },
    Christian: { castes: ['Roman Catholic', 'CSI', 'Baptist'], languages: ['Telugu', 'Tamil', 'Malayalam', 'English'] },
    Sikh: { castes: ['Jat Sikh', 'Khatri', 'Arora'], languages: ['Punjabi', 'Hindi'] },
};

const occupations = ['Software Engineer', 'Doctor', 'Teacher', 'Business Owner', 'Engineer', 'Lawyer', 'Accountant', 'Pharmacist', 'Government Employee', 'Architect', 'Nurse', 'Banker', 'Professor', 'Data Analyst', 'Graphic Designer'];
const educations = ['B.Tech', 'M.Tech', 'MBBS', 'B.Sc', 'M.Sc', 'MBA', 'B.Com', 'M.Com', 'B.A', 'MA', 'LLB', 'BCA', 'MCA', 'PhD'];
const incomes = ['₹25,000 - ₹40,000', '₹40,000 - ₹60,000', '₹60,000 - ₹1,00,000', '₹1,00,000 - ₹1,50,000', '₹1,50,000+'];
const heights = ['5\'0"', '5\'1"', '5\'2"', '5\'3"', '5\'4"', '5\'5"', '5\'6"', '5\'7"', '5\'8"', '5\'9"', '5\'10"', '5\'11"', '6\'0"'];
const hobbiesPool = ['Reading', 'Cooking', 'Travelling', 'Music', 'Sports', 'Photography', 'Gardening', 'Movies', 'Yoga', 'Cricket', 'Badminton', 'Dancing', 'Painting', 'Gaming', 'Hiking'];
const bios = [
    'Looking for a life partner who shares similar values and can be a great companion for life.',
    'Simple, family-oriented person seeking a genuine and caring partner.',
    'Professional with a good sense of humour. Love travelling and exploring new places.',
    'Health-conscious and ambitious. Looking for someone who values family above everything.',
    'Down-to-earth and sincere. Believe in building a life together with trust and love.',
    'Love books and music. Seeking a like-minded partner for a life full of joy and adventure.',
    'Family comes first. Looking for a compatible partner with similar values and goals.',
    'Working professional who loves cooking. Seeking a partner who appreciates simplicity.',
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) { const s = [...arr]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[s[i], s[j]] = [s[j], s[i]]; } return s.slice(0, n); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function slugEmail(name, i) { return name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '.') + i + '@example.com'; }
function dob(ageMin, ageMax) {
    const year = new Date().getFullYear() - randInt(ageMin, ageMax);
    const month = String(randInt(1, 12)).padStart(2, '0');
    const day = String(randInt(1, 28)).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Weighted location selector: 40% Hyderabad, 60% other
function pickLocation() {
    const hyd = locations.slice(0, 8);
    const other = locations.slice(8);
    return Math.random() < 0.40 ? pick(hyd) : pick(other);
}

function getReligion(state) {
    const pool = stateReligionMap[state] || stateReligionMap['default'];
    return pick(pool);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ─── CLEAR EXISTING SEED DATA ──────────────────────────────────────────
    console.log('🧹 Clearing existing seed profiles...');
    const deleteResult = await User.deleteMany({ email: /@example\.com$/ });
    await Profile.deleteMany({ email: /@example\.com$/ });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing seed users.`);

    const shuffledTiers = [...tiers].sort(() => Math.random() - 0.5);
    const credentials = [];
    let created = 0;
    const uniformPassword = 'Password@123';

    for (let i = 0; i < 100; i++) {
        const gender = i < 50 ? 'male' : 'female';
        const fullName = gender === 'male' ? maleNames[i] : femaleNames[i - 50];
        const email = slugEmail(fullName, i + 1);
        const password = uniformPassword;
        const tier = shuffledTiers[i];
        const loc = pickLocation();
        const religion = getReligion(loc.state);
        const relData = religions[religion];
        const caste = pick(relData.castes);
        const motherTongue = pick(relData.languages);
        const occupation = pick(occupations);
        const education = pick(educations);

        try {
            // Create User
            const user = await User.create({
                email,
                password, // pre-save hook will hash it
                fullName,
                gender,
                membershipTier: tier,
                verified: Math.random() > 0.3, // 70% verified
                isAdmin: false,
            });

            // Create Profile
            const profile = new Profile({
                userId: user._id,
                fullName,
                gender,
                dateOfBirth: gender === 'male' ? dob(24, 42) : dob(21, 35),
                height: pick(heights),
                motherTongue,
                maritalStatus: Math.random() > 0.15 ? 'Never Married' : 'Divorced',
                religion,
                caste,
                gothra: religion === 'Hindu' ? pick(['Kashyapa', 'Bharadwaja', 'Atreya', 'Vasistha', 'Gautama', 'Shandilya']) : undefined,
                manglik: religion === 'Hindu' ? pick(['No', 'Yes', 'Partial']) : undefined,
                country: 'India',
                state: loc.state,
                district: loc.district,
                city: loc.city,
                nativePlace: loc.city,
                highestEducation: education,
                degree: education,
                occupation,
                company: pick(['TCS', 'Infosys', 'Wipro', 'HCL', 'L&T', 'HDFC Bank', 'Apollo Hospitals', 'State Bank', 'Govt. of India', 'Private Firm', 'Self Employed']),
                monthlyIncome: pick(incomes),
                placeOfOccupation: loc.city,
                fatherStatus: pick(['Employed', 'Business', 'Retired', 'Expired']),
                motherStatus: pick(['Homemaker', 'Employed', 'Expired']),
                siblings: pick(['No Siblings', '1 Brother', '1 Sister', '2 Brothers', '1 Brother 1 Sister', '2 Sisters']),
                familyType: pick(['Nuclear', 'Joint']),
                familyValues: pick(['Moderate', 'Traditional', 'Liberal']),
                fatherName: gender === 'male' ? pick([...maleNames]).split(' ')[0] + ' ' + fullName.split(' ')[1] : undefined,
                motherName: gender === 'female' ? pick([...femaleNames]).split(' ')[0] + ' ' + fullName.split(' ')[1] : undefined,
                diet: pick(['Vegetarian', 'Non-Vegetarian', 'Eggetarian']),
                smoking: pick(['No', 'No', 'No', 'Occasionally']),
                drinking: pick(['No', 'No', 'Occasionally']),
                hobbies: pickN(hobbiesPool, randInt(3, 6)),
                bio: pick(bios),
                complexion: pick(['Fair', 'Wheatish', 'Wheatish Brown', 'Dark']),
                email,
                membershipTier: tier,
                photoPrivacy: 'visible',
                isActive: true,
                featured: tier === 'crown' || tier === 'diamond' ? Math.random() > 0.5 : false,
                partnerPreferences: {
                    ageRange: gender === 'male'
                        ? { min: 21, max: 32 }
                        : { min: 24, max: 40 },
                    maritalStatus: ['Never Married'],
                    religion: [religion],
                    state: [loc.state, 'Telangana'],
                },
            });
            await profile.save();

            credentials.push({ i: i + 1, name: fullName, email, password, tier, gender, state: loc.state, city: loc.city, religion });
            created++;
            process.stdout.write(`\r  Created ${created}/100 profiles...`);
        } catch (e) {
            console.warn(`\n⚠️  Skipped ${email}: ${e.message}`);
        }
    }

    console.log(`\n\n✅ Successfully created ${created} profiles.\n`);

    // ─── Write credentials file ───────────────────────────────────────────────
    const lines = [
        '# Seed Credentials',
        '',
        '> Auto-generated by `backend/scripts/seed.js`. **All profiles use the same password: `Password@123`**',
        '',
        '| # | Name | Email | Password | Tier | Gender | State | City | Religion |',
        '|---|------|-------|----------|------|--------|-------|------|---------|',
        ...credentials.map(c =>
            `| ${c.i} | ${c.name} | \`${c.email}\` | \`${uniformPassword}\` | ${c.tier} | ${c.gender} | ${c.state} | ${c.city} | ${c.religion} |`
        ),
        '',
        '## Quick Test Logins',
        '',
        '| Tier | Name | Email | Password |',
        '|------|------|-------|----------|',
        ...(['bronze', 'silver', 'gold', 'diamond', 'crown'].map(tier => {
            const c = credentials.find(x => x.tier === tier);
            return c ? `| ${tier} | ${c.name} | \`${c.email}\` | \`${c.password}\` |` : '';
        })),
        '',
        '## Hyderabad Profiles',
        '',
        '| # | Name | Email | Tier | Gender |',
        '|---|------|-------|------|--------|',
        ...credentials.filter(c => c.state === 'Telangana').map(c =>
            `| ${c.i} | ${c.name} | \`${c.email}\` | ${c.tier} | ${c.gender} |`
        ),
    ];

    const outPath = path.resolve(__dirname, 'seed-credentials.md');
    fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
    console.log(`📄 Credentials saved to: ${outPath}`);

    await mongoose.disconnect();
    console.log('✅ Done! Disconnected from MongoDB.');
}

main().catch(err => {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
});
