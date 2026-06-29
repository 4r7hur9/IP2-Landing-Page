const { isDatabaseConfigured } = require("../lib/database");
const express = require("express");
const { requireAdminSession } = require("../middleware/require-admin-session");
const { getAdminDashboardOverview } = require("../services/admin-dashboard-overview");

const router = express.Router();

router.get("/session", requireAdminSession, (req, res) => {
    res.json({
        ok: true,
        session: req.adminSession,
        was_refreshed: req.adminSessionWasRefreshed
    });
});

router.get("/security-status", requireAdminSession, (req, res) => {
    res.json({
        ok: true,
        dashboard_username: req.adminSession.dashboardUsername,
        session_expires_at: req.adminSession.expiresAt,
        session_was_refreshed: req.adminSessionWasRefreshed,
        protections: {
            cookies: ["httpOnly", "sameSite=strict"],
            database_configured: isDatabaseConfigured(),
            global_rate_limit: true,
            login_rate_limit: true,
            csp: true,
            helmet: true
        }
    });
});

router.get("/dashboard-overview", requireAdminSession, async (req, res, next) => {
    try {
        const overview = await getAdminDashboardOverview();

        res.json({
            ok: true,
            overview
        });
    } catch (error) {
        next(error);
    }
});

module.exports = {
    adminApiRouter: router
};
