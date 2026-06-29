const express = require("express");
const { z } = require("zod");
const { ADMIN_AUTH_CONFIG } = require("../config/env");
const { isDatabaseConfigured } = require("../lib/database");
const { attachAdminSession } = require("../middleware/require-admin-session");
const { adminLoginRateLimiter } = require("../middleware/security");
const {
    DatabaseAccessError,
    DatabaseConfigurationError,
    clearAdminAuthCookies,
    endAdminSession,
    isAdminAuthConfigured,
    startAdminSession,
    verifyDashboardCredentials
} = require("../services/admin-auth");
const { recordSecurityAuditEvent } = require("../services/security-audit-log");
const { getRequestIpAddress, getRequestUserAgent } = require("../utils/request-metadata");

const router = express.Router();

const loginPayloadSchema = z.object({
    username: z.string().trim().min(1).max(100),
    password: z.string().min(1).max(256)
});

const renderLoginPage = (res, options = {}) => {
    res.status(options.statusCode || 200).render("pages/admin-login", {
        dashboardUsernameHint: ADMIN_AUTH_CONFIG.dashboardUsername || "admin",
        errorCode: options.errorCode || "",
        errorMessage: options.errorMessage || "",
        isAuthConfigured: isAdminAuthConfigured(),
        isDatabaseConfigured: isDatabaseConfigured(),
        pageTitle: "Login da Dashboard | IP2",
        submittedUsername: options.submittedUsername || ""
    });
};

router.get("/login", attachAdminSession, (req, res) => {
    if (req.adminSession) {
        res.redirect("/admin");
        return;
    }

    const errorCode = typeof req.query.error === "string" ? req.query.error : "";
    const errorMessage =
        errorCode === "config"
            ? "Configure as credenciais administrativas no arquivo .env antes de acessar a dashboard."
            : errorCode === "database"
              ? "Configure o PostgreSQL e execute as migrations antes de usar a dashboard."
            : "";

    renderLoginPage(res, {
        errorCode,
        errorMessage
    });
});

router.post("/login", adminLoginRateLimiter, async (req, res) => {
    if (!isAdminAuthConfigured()) {
        renderLoginPage(res, {
            errorCode: "config",
            errorMessage: "A autenticacao administrativa ainda nao foi configurada no ambiente.",
            statusCode: 503,
            submittedUsername: typeof req.body.username === "string" ? req.body.username : ""
        });
        return;
    }

    if (!isDatabaseConfigured()) {
        renderLoginPage(res, {
            errorCode: "database",
            errorMessage: "A persistencia da dashboard exige DATABASE_URL configurada e migrations aplicadas.",
            statusCode: 503,
            submittedUsername: typeof req.body.username === "string" ? req.body.username : ""
        });
        return;
    }

    const parsedPayload = loginPayloadSchema.safeParse(req.body);

    if (!parsedPayload.success) {
        renderLoginPage(res, {
            errorCode: "validation",
            errorMessage: "Preencha usuario e senha com valores validos.",
            statusCode: 400,
            submittedUsername: typeof req.body.username === "string" ? req.body.username : ""
        });
        return;
    }

    const { password, username } = parsedPayload.data;
    const isValidCredentials = await verifyDashboardCredentials({
        password,
        username
    });

    if (!isValidCredentials) {
        await recordSecurityAuditEvent({
            dashboardUsername: username,
            details: {
                source: "admin_login",
                reason: "invalid_credentials"
            },
            eventType: "ADMIN_LOGIN_FAILURE",
            ipAddress: getRequestIpAddress(req),
            success: false,
            userAgent: getRequestUserAgent(req)
        });
        renderLoginPage(res, {
            errorCode: "credentials",
            errorMessage: "Usuario ou senha invalidos.",
            statusCode: 401,
            submittedUsername: username
        });
        return;
    }

    try {
        await startAdminSession({
            dashboardUsername: username,
            req,
            res
        });
        res.redirect("/admin");
    } catch (error) {
        clearAdminAuthCookies(res);

        if (error instanceof DatabaseConfigurationError || error instanceof DatabaseAccessError) {
            renderLoginPage(res, {
                errorCode: "database",
                errorMessage: "Nao foi possivel abrir a sessao administrativa porque o banco nao esta pronto.",
                statusCode: 503,
                submittedUsername: username
            });
            return;
        }

        throw error;
    }
});

router.post("/logout", async (req, res) => {
    try {
        await endAdminSession({
            req,
            res
        });
    } catch {
        clearAdminAuthCookies(res);
    }

    res.redirect("/admin/login");
});

module.exports = {
    adminAuthRouter: router
};
