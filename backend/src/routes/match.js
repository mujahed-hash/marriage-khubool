const express = require('express');
const { protect } = require('../middleware/auth');
const Profile = require('../models/Profile');
const { resolveProfileById } = require('../helpers/profiles');

const router = express.Router();

router.use(protect);

/**
 * Check if target profile is opposite gender to my profile (male↔female only).
 */
function isOppositeGender(myProfile, targetProfile) {
    const my = String(myProfile?.gender || '').toLowerCase();
    const their = String(targetProfile?.gender || '').toLowerCase();
    if (!my || !their) return true; // If unknown, allow
    return (my === 'male' && their === 'female') || (my === 'female' && their === 'male');
}

/**
 * Calculate match score and breakdown between logged-in user's preferences and target profile.
 * Returns { score, total, breakdown } - breakdown has real data only.
 */
function calculateMatchWithBreakdown(myProfile, targetProfile) {
    if (!targetProfile) return null;
    if (!isOppositeGender(myProfile, targetProfile)) return null;

    const prefs = myProfile?.partnerPreferences || {};
    let score = 0;
    let total = 0;
    const breakdown = [];

    const add = (label, weight, matched, yourPref, theirValue) => {
        total += weight;
        if (matched) score += weight;
        breakdown.push({ label, matched, yourPreference: yourPref || null, theirValue: theirValue || null });
    };

    // Age (from dateOfBirth)
    if (prefs.ageRange?.min != null && prefs.ageRange?.max != null && targetProfile.dateOfBirth) {
        const birthYear = parseInt(targetProfile.dateOfBirth.split(/[-/]/)[0] || String(targetProfile.dateOfBirth).slice(-4), 10);
        const age = new Date().getFullYear() - birthYear;
        const inRange = age >= prefs.ageRange.min && age <= prefs.ageRange.max;
        const nearRange = Math.abs(age - (prefs.ageRange.min + prefs.ageRange.max) / 2) <= 3;
        const matched = inRange ? 15 : (nearRange ? 8 : 0);
        if (inRange) score += 15; else if (nearRange) score += 8;
        total += 15;
        breakdown.push({
            label: 'Age',
            matched: inRange || nearRange,
            yourPreference: `${prefs.ageRange.min}-${prefs.ageRange.max} yrs`,
            theirValue: `${age} yrs`
        });
    }

    // Religion
    if (prefs.religion?.length && targetProfile.religion) {
        const matched = prefs.religion.some((r) => String(r).toLowerCase().includes(String(targetProfile.religion).toLowerCase()));
        add('Religion', 20, matched, prefs.religion.join(', '), targetProfile.religion);
    }

    // Marital status
    if (prefs.maritalStatus?.length && targetProfile.maritalStatus) {
        const matched = prefs.maritalStatus.some((m) => String(m).toLowerCase().includes(String(targetProfile.maritalStatus).toLowerCase()));
        add('Marital Status', 15, matched, prefs.maritalStatus.join(', '), targetProfile.maritalStatus);
    }

    // Mother tongue
    if (prefs.motherTongue?.length && targetProfile.motherTongue) {
        const matched = prefs.motherTongue.some((t) => String(t).toLowerCase().includes(String(targetProfile.motherTongue).toLowerCase()));
        add('Mother Tongue', 10, matched, prefs.motherTongue.join(', '), targetProfile.motherTongue);
    }

    // Diet
    if (prefs.diet?.length && targetProfile.diet) {
        const matched = prefs.diet.some((d) => String(d).toLowerCase().includes(String(targetProfile.diet).toLowerCase()));
        add('Diet', 10, matched, prefs.diet.join(', '), targetProfile.diet);
    }

    // State
    if (prefs.state?.length && targetProfile.state) {
        const matched = prefs.state.some((s) => String(s).toLowerCase().includes(String(targetProfile.state).toLowerCase()));
        add('Location (State)', 15, matched, prefs.state.join(', '), targetProfile.state);
    }

    // City
    if (prefs.city && targetProfile.city) {
        const matched = String(prefs.city).toLowerCase().includes(String(targetProfile.city).toLowerCase());
        add('City', 5, matched, prefs.city, targetProfile.city);
    }

    // Complexion
    if (prefs.complexion?.length && targetProfile.complexion) {
        const matched = prefs.complexion.some((c) => String(c).toLowerCase().includes(String(targetProfile.complexion).toLowerCase()));
        add('Complexion', 10, matched, prefs.complexion.join(', '), targetProfile.complexion);
    }

    if (total === 0) return null; // No preferences set – no fabricated score
    return {
        score: Math.round((score / total) * 100),
        total,
        breakdown
    };
}

// POST /api/match/batch – match scores for multiple profiles
router.post('/batch', async (req, res) => {
    try {
        const { profileIds } = req.body || {};
        if (!Array.isArray(profileIds) || profileIds.length === 0) {
            return res.json({ scores: {} });
        }
        const myProfile = await Profile.findOne({ userId: req.user._id });
        if (!myProfile) return res.json({ scores: {} });

        const targets = await Profile.find({ _id: { $in: profileIds } });
        const scores = {};
        for (const t of targets) {
            const result = calculateMatchWithBreakdown(myProfile, t);
            scores[t._id.toString()] = result ? result.score : null;
        }
        res.json({ scores });
    } catch (err) {
        res.status(500).json({ message: 'Failed to calculate match.', error: err.message });
    }
});

// GET /api/match/:profileId – match % (add ?breakdown=true for breakdown) between logged-in user and target profile
router.get('/:profileId', async (req, res) => {
    try {
        const myProfile = await Profile.findOne({ userId: req.user._id });
        const targetProfile = await resolveProfileById(req.params.profileId);
        if (!myProfile || !targetProfile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }
        const result = calculateMatchWithBreakdown(myProfile, targetProfile);
        if (!result) {
            return res.json({ matchScore: null, breakdown: null });
        }
        const withBreakdown = req.query.breakdown === 'true' || req.query.breakdown === '1';
        res.json({
            matchScore: result.score,
            ...(withBreakdown && { breakdown: result.breakdown })
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to calculate match.', error: err.message });
    }
});

module.exports = router;
