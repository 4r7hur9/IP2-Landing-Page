const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = (process.env.NODE_ENV || "development").trim().toLowerCase();

const readStringEnv = (name, fallback = "") => (process.env[name] || fallback).trim();
const readNumberEnv = (name, fallback) => {
    const rawValue = process.env[name];
    const parsedValue = Number(rawValue);

    return Number.isFinite(parsedValue) ? parsedValue : fallback;
};
const parseTrustProxyValue = rawValue => {
    const normalizedValue = String(rawValue || "").trim().toLowerCase();

    if (!normalizedValue || normalizedValue === "false" || normalizedValue === "0") {
        return false;
    }

    if (normalizedValue === "true" || normalizedValue === "1") {
        return 1;
    }

    const parsedNumericValue = Number(normalizedValue);

    if (Number.isFinite(parsedNumericValue)) {
        return parsedNumericValue;
    }

    return String(rawValue).trim();
};

const META_CONFIG = {
    pixelId: process.env.META_PIXEL_ID || "1955246271821508",
    accessToken: readStringEnv("META_ACCESS_TOKEN"),
    apiVersion: readStringEnv("META_API_VERSION", "v25.0"),
    testEventCode: readStringEnv("META_TEST_EVENT_CODE")
};

const ADMIN_AUTH_CONFIG = {
    dashboardUsername: readStringEnv("ADMIN_DASHBOARD_USER"),
    dashboardPasswordHash: readStringEnv("ADMIN_DASHBOARD_PASSWORD_HASH"),
    accessCookieName: "ip2_admin_access",
    refreshCookieName: "ip2_admin_refresh",
    accessTokenSecret: readStringEnv("JWT_ACCESS_SECRET"),
    refreshTokenSecret: readStringEnv("JWT_REFRESH_SECRET"),
    accessTokenTtl: readStringEnv("JWT_ACCESS_TTL", "15m"),
    refreshTokenTtl: readStringEnv("JWT_REFRESH_TTL", "7d"),
    loginRateLimitMaxAttempts: readNumberEnv("ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS", 5),
    loginRateLimitWindowMs: readNumberEnv("ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000)
};

const APP_CONFIG = {
    isProduction: NODE_ENV === "production",
    nodeEnv: NODE_ENV,
    trustProxy: parseTrustProxyValue(process.env.TRUST_PROXY)
};

module.exports = {
    ADMIN_AUTH_CONFIG,
    APP_CONFIG,
    META_CONFIG,
    NODE_ENV,
    PORT,
    ROOT_DIR
};
