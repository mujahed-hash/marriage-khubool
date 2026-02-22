const AdminAuditLog = require('../models/AdminAuditLog');

/**
 * Log an admin action. Call after successful mutations.
 * @param {Object} opts
 * @param {string} opts.adminId - Admin user ID
 * @param {string} opts.action - e.g. 'suspend_user', 'delete_user', 'resolve_report'
 * @param {string} opts.resource - e.g. 'user', 'profile', 'report'
 * @param {string} [opts.resourceId] - ID of affected resource
 * @param {Object} [opts.details] - Additional context
 * @param {Object} [opts.req] - Express req (for ip, userAgent)
 */
async function logAdminAction({ adminId, action, resource, resourceId, details, req }) {
    try {
        await AdminAuditLog.create({
            adminId,
            action,
            resource,
            resourceId: resourceId || undefined,
            details: details || undefined,
            ip: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.get?.('user-agent')
        });
    } catch (err) {
        console.error('[adminAudit] Failed to log:', err.message);
    }
}

module.exports = { logAdminAction };
