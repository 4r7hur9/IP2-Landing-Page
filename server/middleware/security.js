const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { ADMIN_AUTH_CONFIG, APP_CONFIG } = require("../config/env");

const createRateLimitMessage = error => ({
    ok: false,
    error
});

const createRateLimiter = ({ errorMessage, limit, skipSuccessfulRequests = false, windowMs }) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests,
        message: createRateLimitMessage(errorMessage)
    });

const applyGlobalSecurityHeaders = helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
});

const contentSecurityPolicyDirectives = {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    imgSrc: ["'self'", "data:"],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"]
};

if (APP_CONFIG.isProduction) {
    contentSecurityPolicyDirectives.upgradeInsecureRequests = [];
}

const applyAdminSecurityHeaders = helmet({
    contentSecurityPolicy: {
        directives: contentSecurityPolicyDirectives
    },
    crossOriginEmbedderPolicy: false
});

const globalRateLimiter = createRateLimiter({
    errorMessage: "Too many requests. Please try again later.",
    limit: 300,
    windowMs: 15 * 60 * 1000
});

const adminApiRateLimiter = createRateLimiter({
    errorMessage: "Too many admin requests. Please slow down.",
    limit: 120,
    windowMs: 60 * 1000
});

const adminLoginRateLimiter = createRateLimiter({
    errorMessage: "Too many login attempts. Please try again later.",
    limit: ADMIN_AUTH_CONFIG.loginRateLimitMaxAttempts,
    skipSuccessfulRequests: true,
    windowMs: ADMIN_AUTH_CONFIG.loginRateLimitWindowMs
});

module.exports = {
    adminApiRateLimiter,
    adminLoginRateLimiter,
    applyAdminSecurityHeaders,
    applyGlobalSecurityHeaders,
    globalRateLimiter
};
