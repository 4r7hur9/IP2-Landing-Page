const express = require("express");
const { z } = require("zod");
const { requireAdminSession } = require("../middleware/require-admin-session");
const { getAdminDashboardOverview } = require("../services/admin-dashboard-overview");
const { createMetaQualitySnapshot } = require("../services/meta-quality-snapshot");

const router = express.Router();
const redirectToDashboardWithStatus = snapshotStatusCode => `/admin?snapshot=${snapshotStatusCode}`;
const metaQualitySnapshotSchema = z.object({
    datasetId: z.string().trim().max(120).optional().default(""),
    diagnosticsJson: z.string().trim().optional().default(""),
    matchingStatus: z.string().trim().max(120).optional().default(""),
    qualityScore: z.union([z.literal(""), z.coerce.number().int().min(0).max(100)]),
    qualityStatus: z.string().trim().max(120).optional().default(""),
    source: z.string().trim().min(2).max(50).default("manual")
});

const parseDiagnosticsJson = diagnosticsJson => {
    if (!diagnosticsJson) {
        return null;
    }

    return JSON.parse(diagnosticsJson);
};

const normalizeOptionalValue = rawValue => {
    const normalizedValue = String(rawValue || "").trim();

    return normalizedValue ? normalizedValue : null;
};

const getSnapshotFeedback = snapshotStatusCode => {
    if (snapshotStatusCode === "success") {
        return {
            message: "Snapshot de Dataset Quality registrado com sucesso.",
            tone: "success"
        };
    }

    if (snapshotStatusCode === "invalid") {
        return {
            message: "Revise os campos do snapshot manual antes de salvar novamente.",
            tone: "warning"
        };
    }

    if (snapshotStatusCode === "error") {
        return {
            message: "Nao foi possivel salvar o snapshot no banco nesta tentativa.",
            tone: "danger"
        };
    }

    return null;
};

router.get("/", requireAdminSession, async (req, res, next) => {
    try {
        const dashboardOverview = await getAdminDashboardOverview();

        res.render("pages/admin-dashboard", {
            dashboardOverview,
            dashboardUsername: req.adminSession.dashboardUsername,
            pageTitle: "Dashboard Interna | IP2",
            sessionExpiresAt: req.adminSession.expiresAt,
            sessionIssuedAt: req.adminSession.issuedAt,
            sessionWasRefreshed: req.adminSessionWasRefreshed,
            snapshotFeedback: getSnapshotFeedback(req.query.snapshot)
        });
    } catch (error) {
        next(error);
    }
});

router.post("/meta-quality-snapshots", requireAdminSession, async (req, res) => {
    const parsedSnapshot = metaQualitySnapshotSchema.safeParse(req.body);

    if (!parsedSnapshot.success) {
        res.redirect(redirectToDashboardWithStatus("invalid"));
        return;
    }

    try {
        const diagnostics = parseDiagnosticsJson(parsedSnapshot.data.diagnosticsJson);
        const createdSnapshot = await createMetaQualitySnapshot({
            datasetId: normalizeOptionalValue(parsedSnapshot.data.datasetId),
            diagnostics: diagnostics || undefined,
            matchingStatus: normalizeOptionalValue(parsedSnapshot.data.matchingStatus),
            qualityScore:
                parsedSnapshot.data.qualityScore === "" ? null : Number(parsedSnapshot.data.qualityScore),
            qualityStatus: normalizeOptionalValue(parsedSnapshot.data.qualityStatus),
            source: parsedSnapshot.data.source
        });

        if (!createdSnapshot) {
            res.redirect(redirectToDashboardWithStatus("error"));
            return;
        }

        res.redirect(redirectToDashboardWithStatus("success"));
    } catch {
        res.redirect(redirectToDashboardWithStatus("invalid"));
    }
});

module.exports = {
    adminPageRouter: router
};
