/**
 * Log guest activity for analytics. No PII.
 * Replace with your analytics service (GA, Mixpanel, etc.) in production.
 */
function logGuestActivity(req, endpoint, extra = {}) {
    const entry = {
        ts: new Date().toISOString(),
        endpoint,
        method: req.method,
        ...extra
    };
    if (process.env.NODE_ENV !== 'test') {
        console.log('[guest]', JSON.stringify(entry));
    }
}

module.exports = { logGuestActivity };
