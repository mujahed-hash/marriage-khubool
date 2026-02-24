const rateLimit = require('express-rate-limit');

/**
 * Rate limit for guest-accessible profile list/search endpoint.
 * Reduces scraping risk. 60 requests per minute per IP.
 */
const guestProfileListLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { guestProfileListLimiter };
