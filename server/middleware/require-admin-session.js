const {
    DatabaseAccessError,
    DatabaseConfigurationError,
    clearAdminAuthCookies,
    isAdminAuthConfigured,
    resolveAdminSession
} = require("../services/admin-auth");
const { recordSecurityAuditEvent } = require("../services/security-audit-log");
const { getRequestIpAddress, getRequestUserAgent } = require("../utils/request-metadata");

const isJsonRequest = req => {
    const acceptedTypes = req.accepts(["html", "json"]);

    return acceptedTypes === "json" || req.originalUrl.startsWith("/api/");
};

const respondToUnauthenticatedRequest = (req, res) => {
    recordSecurityAuditEvent({
        details: {
            path: req.originalUrl,
            source: "require_admin_session"
        },
        eventType: "ADMIN_UNAUTHORIZED_ACCESS",
        ipAddress: getRequestIpAddress(req),
        success: false,
        userAgent: getRequestUserAgent(req)
    });

    if (isJsonRequest(req)) {
        res.status(401).json({
            ok: false,
            error: "Authentication required"
        });
        return;
    }

    res.redirect("/admin/login");
};

const respondToUnconfiguredRequest = (req, res) => {
    if (isJsonRequest(req)) {
        res.status(503).json({
            ok: false,
            error: "Admin authentication is not configured"
        });
        return;
    }

    res.redirect("/admin/login?error=config");
};

const respondToDatabaseFailure = (req, res) => {
    if (isJsonRequest(req)) {
        res.status(503).json({
            ok: false,
            error: "Database is unavailable or not configured for admin persistence"
        });
        return;
    }

    res.redirect("/admin/login?error=database");
};

const attachAdminSession = async (req, res, next) => {
    if (!isAdminAuthConfigured()) {
        clearAdminAuthCookies(res);
        req.adminSession = null;
        req.adminSessionWasRefreshed = false;
        next();
        return;
    }

    try {
        const resolvedSession = await resolveAdminSession(req, res);

        req.adminSession = resolvedSession.session;
        req.adminSessionWasRefreshed = resolvedSession.wasRefreshed;
        req.adminSessionPersistenceError = null;
        next();
    } catch (error) {
        if (error instanceof DatabaseConfigurationError || error instanceof DatabaseAccessError) {
            clearAdminAuthCookies(res);
            req.adminSession = null;
            req.adminSessionWasRefreshed = false;
            req.adminSessionPersistenceError = error;
            next();
            return;
        }

        next(error);
    }
};

const requireAdminSession = async (req, res, next) => {
    if (!isAdminAuthConfigured()) {
        clearAdminAuthCookies(res);
        respondToUnconfiguredRequest(req, res);
        return;
    }

    try {
        const resolvedSession = await resolveAdminSession(req, res);

        if (!resolvedSession.session) {
            respondToUnauthenticatedRequest(req, res);
            return;
        }

        req.adminSession = resolvedSession.session;
        req.adminSessionWasRefreshed = resolvedSession.wasRefreshed;
        next();
    } catch (error) {
        if (error instanceof DatabaseConfigurationError || error instanceof DatabaseAccessError) {
            clearAdminAuthCookies(res);
            respondToDatabaseFailure(req, res);
            return;
        }

        next(error);
    }
};

module.exports = {
    attachAdminSession,
    requireAdminSession
};
