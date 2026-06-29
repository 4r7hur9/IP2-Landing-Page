const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ADMIN_AUTH_CONFIG, APP_CONFIG } = require("../config/env");
const { DatabaseAccessError, DatabaseConfigurationError } = require("../lib/database");
const {
    createAdminSessionRecord,
    findAdminSessionById,
    hashRefreshToken,
    revokeAdminSessionById,
    rotateAdminSessionRefreshToken,
    touchAdminSession
} = require("./admin-session-store");
const { recordSecurityAuditEvent } = require("./security-audit-log");
const { parseDurationToMilliseconds } = require("../utils/duration");
const { getRequestIpAddress, getRequestUserAgent } = require("../utils/request-metadata");

const AUTH_AUDIENCE = "ip2-admin-dashboard";
const AUTH_ISSUER = "ip2-internal";
const FALLBACK_PASSWORD_HASH = "$2b$12$4tO5B5v2GW5/KwZFKyQz5.Us7rBuzYkLQfE5LJxT2SC6KB6v5FC2e";

const constantTimeEqual = (leftValue, rightValue) => {
    const leftBuffer = Buffer.from(String(leftValue || ""));
    const rightBuffer = Buffer.from(String(rightValue || ""));

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const isAdminAuthConfigured = () =>
    Boolean(
        ADMIN_AUTH_CONFIG.dashboardUsername &&
            ADMIN_AUTH_CONFIG.dashboardPasswordHash &&
            ADMIN_AUTH_CONFIG.accessTokenSecret &&
            ADMIN_AUTH_CONFIG.refreshTokenSecret
    );

const buildCookieOptions = maxAge => ({
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "strict",
    secure: APP_CONFIG.isProduction
});

const buildTokenPayloadWithSession = ({ dashboardUsername, sessionId, tokenType }) => ({
    scope: "admin:dashboard",
    sessionId,
    tokenType,
    sub: dashboardUsername
});

const createSignedToken = ({ dashboardUsername, expiresIn, secret, sessionId, tokenType }) =>
    jwt.sign(buildTokenPayloadWithSession({ dashboardUsername, sessionId, tokenType }), secret, {
        audience: AUTH_AUDIENCE,
        expiresIn,
        issuer: AUTH_ISSUER,
        jwtid: crypto.randomUUID()
    });

const verifySignedToken = ({ expectedTokenType, secret, token }) => {
    try {
        const payload = jwt.verify(token, secret, {
            audience: AUTH_AUDIENCE,
            issuer: AUTH_ISSUER
        });

        if (!payload || payload.tokenType !== expectedTokenType) {
            return {
                payload: null,
                valid: false
            };
        }

        return {
            payload,
            valid: true
        };
    } catch {
        return {
            payload: null,
            valid: false
        };
    }
};

const buildAdminSession = payload => ({
    dashboardUsername: payload.sub,
    expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
    issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
    sessionId: payload.sessionId,
    scope: payload.scope
});

const isStoredSessionActive = storedSession =>
    Boolean(
        storedSession &&
            !storedSession.revokedAt &&
            storedSession.refreshTokenExpiresAt &&
            storedSession.refreshTokenExpiresAt.getTime() > Date.now()
    );

const buildAuditContext = req => ({
    ipAddress: getRequestIpAddress(req),
    userAgent: getRequestUserAgent(req)
});

const readTokenFromCookies = (cookies, cookieName) => {
    if (!cookies || typeof cookies[cookieName] !== "string") {
        return "";
    }

    return cookies[cookieName];
};

const clearAdminAuthCookies = res => {
    res.clearCookie(ADMIN_AUTH_CONFIG.accessCookieName, {
        path: "/",
        sameSite: "strict",
        secure: APP_CONFIG.isProduction
    });
    res.clearCookie(ADMIN_AUTH_CONFIG.refreshCookieName, {
        path: "/",
        sameSite: "strict",
        secure: APP_CONFIG.isProduction
    });
};

const setAdminAuthCookies = (res, tokens) => {
    const accessTokenMaxAge = parseDurationToMilliseconds(ADMIN_AUTH_CONFIG.accessTokenTtl);
    const refreshTokenMaxAge = parseDurationToMilliseconds(ADMIN_AUTH_CONFIG.refreshTokenTtl);

    res.cookie(
        ADMIN_AUTH_CONFIG.accessCookieName,
        tokens.accessToken,
        buildCookieOptions(accessTokenMaxAge)
    );
    res.cookie(
        ADMIN_AUTH_CONFIG.refreshCookieName,
        tokens.refreshToken,
        buildCookieOptions(refreshTokenMaxAge)
    );
};

const createTokenBundle = ({ dashboardUsername, sessionId }) => {
    const accessToken = createSignedToken({
        dashboardUsername,
        expiresIn: ADMIN_AUTH_CONFIG.accessTokenTtl,
        secret: ADMIN_AUTH_CONFIG.accessTokenSecret,
        sessionId,
        tokenType: "access"
    });
    const refreshToken = createSignedToken({
        dashboardUsername,
        expiresIn: ADMIN_AUTH_CONFIG.refreshTokenTtl,
        secret: ADMIN_AUTH_CONFIG.refreshTokenSecret,
        sessionId,
        tokenType: "refresh"
    });

    return {
        accessToken,
        refreshToken,
        refreshTokenExpiresAt: new Date(
            Date.now() + parseDurationToMilliseconds(ADMIN_AUTH_CONFIG.refreshTokenTtl)
        )
    };
};

const startAdminSession = async ({ req, res, dashboardUsername }) => {
    const sessionId = crypto.randomUUID();
    const tokenBundle = createTokenBundle({
        dashboardUsername,
        sessionId
    });

    await createAdminSessionRecord({
        dashboardUsername,
        id: sessionId,
        ipAddress: getRequestIpAddress(req) || null,
        lastUsedAt: new Date(),
        refreshTokenExpiresAt: tokenBundle.refreshTokenExpiresAt,
        refreshTokenHash: hashRefreshToken(tokenBundle.refreshToken),
        userAgent: getRequestUserAgent(req) || null
    });
    setAdminAuthCookies(res, tokenBundle);

    await recordSecurityAuditEvent({
        dashboardUsername,
        details: {
            source: "admin_login"
        },
        eventType: "ADMIN_LOGIN_SUCCESS",
        ...buildAuditContext(req),
        sessionId,
        success: true
    });

    return {
        sessionId
    };
};

const resolveAdminSession = async (req, res) => {
    const accessToken = readTokenFromCookies(req.cookies, ADMIN_AUTH_CONFIG.accessCookieName);
    const refreshToken = readTokenFromCookies(req.cookies, ADMIN_AUTH_CONFIG.refreshCookieName);

    if (accessToken) {
        const verifiedAccessToken = verifySignedToken({
            expectedTokenType: "access",
            secret: ADMIN_AUTH_CONFIG.accessTokenSecret,
            token: accessToken
        });

        if (verifiedAccessToken.valid) {
            const storedSession = await findAdminSessionById(verifiedAccessToken.payload.sessionId);

            if (!isStoredSessionActive(storedSession)) {
                clearAdminAuthCookies(res);
                return {
                    session: null,
                    wasRefreshed: false
                };
            }

            await touchAdminSession(storedSession.id);
            return {
                session: buildAdminSession(verifiedAccessToken.payload),
                wasRefreshed: false
            };
        }
    }

    if (!refreshToken) {
        if (accessToken) {
            clearAdminAuthCookies(res);
        }

        return {
            session: null,
            wasRefreshed: false
        };
    }

    const verifiedRefreshToken = verifySignedToken({
        expectedTokenType: "refresh",
        secret: ADMIN_AUTH_CONFIG.refreshTokenSecret,
        token: refreshToken
    });

    if (!verifiedRefreshToken.valid) {
        clearAdminAuthCookies(res);
        return {
            session: null,
            wasRefreshed: false
        };
    }

    const storedSession = await findAdminSessionById(verifiedRefreshToken.payload.sessionId);

    if (
        !isStoredSessionActive(storedSession) ||
        storedSession.dashboardUsername !== verifiedRefreshToken.payload.sub ||
        storedSession.refreshTokenHash !== hashRefreshToken(refreshToken)
    ) {
        clearAdminAuthCookies(res);
        return {
            session: null,
            wasRefreshed: false
        };
    }

    const refreshedTokens = createTokenBundle({
        dashboardUsername: verifiedRefreshToken.payload.sub,
        sessionId: storedSession.id
    });

    await rotateAdminSessionRefreshToken({
        refreshToken: refreshedTokens.refreshToken,
        refreshTokenExpiresAt: refreshedTokens.refreshTokenExpiresAt,
        sessionId: storedSession.id
    });
    setAdminAuthCookies(res, refreshedTokens);
    await recordSecurityAuditEvent({
        dashboardUsername: storedSession.dashboardUsername,
        details: {
            source: "session_refresh"
        },
        eventType: "ADMIN_SESSION_REFRESH",
        ...buildAuditContext(req),
        sessionId: storedSession.id,
        success: true
    });
    const verifiedRefreshedAccessToken = verifySignedToken({
        expectedTokenType: "access",
        secret: ADMIN_AUTH_CONFIG.accessTokenSecret,
        token: refreshedTokens.accessToken
    });

    return {
        session: buildAdminSession(verifiedRefreshedAccessToken.payload),
        wasRefreshed: true
    };
};

const endAdminSession = async ({ req, res }) => {
    const accessToken = readTokenFromCookies(req.cookies, ADMIN_AUTH_CONFIG.accessCookieName);
    const refreshToken = readTokenFromCookies(req.cookies, ADMIN_AUTH_CONFIG.refreshCookieName);

    let sessionId = "";
    let dashboardUsername = "";

    if (accessToken) {
        const verifiedAccessToken = verifySignedToken({
            expectedTokenType: "access",
            secret: ADMIN_AUTH_CONFIG.accessTokenSecret,
            token: accessToken
        });

        if (verifiedAccessToken.valid) {
            sessionId = verifiedAccessToken.payload.sessionId || "";
            dashboardUsername = verifiedAccessToken.payload.sub || "";
        }
    }

    if (!sessionId && refreshToken) {
        const verifiedRefreshToken = verifySignedToken({
            expectedTokenType: "refresh",
            secret: ADMIN_AUTH_CONFIG.refreshTokenSecret,
            token: refreshToken
        });

        if (verifiedRefreshToken.valid) {
            sessionId = verifiedRefreshToken.payload.sessionId || "";
            dashboardUsername = verifiedRefreshToken.payload.sub || "";
        }
    }

    if (sessionId) {
        await revokeAdminSessionById(sessionId);
        await recordSecurityAuditEvent({
            dashboardUsername: dashboardUsername || null,
            details: {
                source: "manual_logout"
            },
            eventType: "ADMIN_LOGOUT",
            ...buildAuditContext(req),
            sessionId,
            success: true
        });
    }

    clearAdminAuthCookies(res);
};

const verifyDashboardCredentials = async ({ password, username }) => {
    const configuredHash = ADMIN_AUTH_CONFIG.dashboardPasswordHash || FALLBACK_PASSWORD_HASH;
    const isUsernameValid = constantTimeEqual(username, ADMIN_AUTH_CONFIG.dashboardUsername);
    const isPasswordValid = await bcrypt.compare(password, configuredHash).catch(() => false);

    return isAdminAuthConfigured() && isUsernameValid && isPasswordValid;
};

module.exports = {
    DatabaseAccessError,
    DatabaseConfigurationError,
    clearAdminAuthCookies,
    endAdminSession,
    isAdminAuthConfigured,
    resolveAdminSession,
    startAdminSession,
    verifyDashboardCredentials
};
