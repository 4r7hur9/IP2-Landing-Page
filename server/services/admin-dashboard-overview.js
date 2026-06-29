const { DatabaseAccessError, DatabaseConfigurationError, isDatabaseConfigured, runDatabaseOperation } = require("../lib/database");
const { getHealthStatus } = require("./meta-conversions");

const DASHBOARD_LOOKBACK_DAYS = 7;
const RECENT_META_EVENTS_LIMIT = 10;
const RECENT_SECURITY_EVENTS_LIMIT = 10;
const RECENT_QUALITY_SNAPSHOTS_LIMIT = 5;
const DASHBOARD_TIMEZONE = "America/Sao_Paulo";
const FAILED_META_STATUSES = [
    "FAILED",
    "CONFIGURATION_ERROR",
    "REQUEST_ERROR",
    "VALIDATION_ERROR"
];
const securityEventLabelByType = {
    ADMIN_LOGIN_SUCCESS: "Login administrativo",
    ADMIN_LOGIN_FAILURE: "Falha de login",
    ADMIN_LOGOUT: "Logout administrativo",
    ADMIN_SESSION_REFRESH: "Renovacao de sessao",
    ADMIN_SESSION_REVOKED: "Sessao revogada",
    ADMIN_UNAUTHORIZED_ACCESS: "Acesso nao autorizado"
};
const metaStatusLabelByStatus = {
    ACCEPTED: "Aceito",
    FAILED: "Falhou",
    CONFIGURATION_ERROR: "Erro de configuracao",
    REQUEST_ERROR: "Erro de requisicao",
    VALIDATION_ERROR: "Erro de validacao"
};
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: DASHBOARD_TIMEZONE
});
const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: DASHBOARD_TIMEZONE
});

const toDateKey = dateValue => {
    const normalizedDate = new Date(dateValue);
    const dateParts = new Intl.DateTimeFormat("en-CA", {
        day: "2-digit",
        month: "2-digit",
        timeZone: DASHBOARD_TIMEZONE,
        year: "numeric"
    }).formatToParts(normalizedDate);

    const partByType = Object.fromEntries(dateParts.map(datePart => [datePart.type, datePart.value]));

    return `${partByType.year}-${partByType.month}-${partByType.day}`;
};

const formatDateTimeLabel = dateValue => dateTimeFormatter.format(new Date(dateValue));

const createLookbackStartDate = () => {
    const currentDate = new Date();
    const lookbackStartDate = new Date(currentDate);

    lookbackStartDate.setHours(0, 0, 0, 0);
    lookbackStartDate.setDate(lookbackStartDate.getDate() - (DASHBOARD_LOOKBACK_DAYS - 1));

    return lookbackStartDate;
};

const createEmptyDailyActivitySeries = () => {
    const lookbackStartDate = createLookbackStartDate();

    return Array.from({ length: DASHBOARD_LOOKBACK_DAYS }, (_, dayOffset) => {
        const currentSeriesDate = new Date(lookbackStartDate);

        currentSeriesDate.setDate(currentSeriesDate.getDate() + dayOffset);

        return {
            dateKey: toDateKey(currentSeriesDate),
            dateLabel: dayFormatter.format(currentSeriesDate),
            leadEventsCount: 0,
            metaEventsCount: 0,
            securityAlertsCount: 0
        };
    });
};

const buildMetaStatusTone = status => {
    if (status === "ACCEPTED") {
        return "success";
    }

    if (status === "FAILED" || status === "REQUEST_ERROR" || status === "VALIDATION_ERROR") {
        return "danger";
    }

    if (status === "CONFIGURATION_ERROR") {
        return "warning";
    }

    return "neutral";
};

const buildSecurityEventTone = auditEvent => {
    if (!auditEvent.success) {
        return "danger";
    }

    if (auditEvent.eventType === "ADMIN_SESSION_REFRESH") {
        return "warning";
    }

    return "success";
};

const buildRecentMetaEvents = metaEventLogs =>
    metaEventLogs.map(metaEventLog => ({
        contentName: metaEventLog.contentName || "-",
        createdAtLabel: formatDateTimeLabel(metaEventLog.createdAt),
        eventName: metaEventLog.eventName,
        httpStatus: metaEventLog.httpStatus,
        id: metaEventLog.id,
        pageType: metaEventLog.pageType || "-",
        planInterest: metaEventLog.planInterest || "-",
        profile: metaEventLog.profile || "-",
        status: metaEventLog.status,
        statusLabel: metaStatusLabelByStatus[metaEventLog.status] || metaEventLog.status,
        statusTone: buildMetaStatusTone(metaEventLog.status)
    }));

const buildRecentSecurityEvents = securityAuditLogs =>
    securityAuditLogs.map(securityAuditLog => ({
        createdAtLabel: formatDateTimeLabel(securityAuditLog.createdAt),
        dashboardUsername: securityAuditLog.dashboardUsername || "-",
        eventType: securityAuditLog.eventType,
        eventTypeLabel: securityEventLabelByType[securityAuditLog.eventType] || securityAuditLog.eventType,
        id: securityAuditLog.id,
        ipAddress: securityAuditLog.ipAddress || "-",
        success: securityAuditLog.success,
        tone: buildSecurityEventTone(securityAuditLog)
    }));

const buildRecentQualitySnapshots = qualitySnapshots =>
    qualitySnapshots.map(qualitySnapshot => ({
        createdAtLabel: formatDateTimeLabel(qualitySnapshot.createdAt),
        datasetId: qualitySnapshot.datasetId || "-",
        diagnosticsPreview: qualitySnapshot.diagnostics
            ? JSON.stringify(qualitySnapshot.diagnostics, null, 2)
            : "",
        id: qualitySnapshot.id,
        matchingStatus: qualitySnapshot.matchingStatus || "-",
        qualityScore: Number.isFinite(qualitySnapshot.qualityScore) ? qualitySnapshot.qualityScore : null,
        qualityStatus: qualitySnapshot.qualityStatus || "-",
        source: qualitySnapshot.source || "manual"
    }));

const buildEventBreakdown = metaEventLogs => {
    const countByEventName = new Map();

    metaEventLogs.forEach(metaEventLog => {
        const currentCount = countByEventName.get(metaEventLog.eventName) || 0;

        countByEventName.set(metaEventLog.eventName, currentCount + 1);
    });

    return Array.from(countByEventName.entries())
        .map(([eventName, count]) => ({
            count,
            eventName
        }))
        .sort((leftEntry, rightEntry) => rightEntry.count - leftEntry.count)
        .slice(0, 5);
};

const buildDailyActivitySeries = ({ metaEventLogs, securityAuditLogs }) => {
    const dailyActivityByKey = new Map(
        createEmptyDailyActivitySeries().map(dailyActivityItem => [dailyActivityItem.dateKey, dailyActivityItem])
    );

    metaEventLogs.forEach(metaEventLog => {
        const dateKey = toDateKey(metaEventLog.createdAt);
        const dailyActivityItem = dailyActivityByKey.get(dateKey);

        if (!dailyActivityItem) {
            return;
        }

        dailyActivityItem.metaEventsCount += 1;

        if (metaEventLog.eventName === "Lead") {
            dailyActivityItem.leadEventsCount += 1;
        }
    });

    securityAuditLogs.forEach(securityAuditLog => {
        const dateKey = toDateKey(securityAuditLog.createdAt);
        const dailyActivityItem = dailyActivityByKey.get(dateKey);

        if (!dailyActivityItem || securityAuditLog.success) {
            return;
        }

        dailyActivityItem.securityAlertsCount += 1;
    });

    const dailyActivitySeries = Array.from(dailyActivityByKey.values());
    const maxMetaEventsCount = Math.max(1, ...dailyActivitySeries.map(item => item.metaEventsCount));
    const maxSecurityAlertsCount = Math.max(1, ...dailyActivitySeries.map(item => item.securityAlertsCount));

    return dailyActivitySeries.map(dailyActivityItem => ({
        ...dailyActivityItem,
        metaEventsWidthPercentage: Math.round((dailyActivityItem.metaEventsCount / maxMetaEventsCount) * 100),
        securityAlertsWidthPercentage: Math.round(
            (dailyActivityItem.securityAlertsCount / maxSecurityAlertsCount) * 100
        )
    }));
};

const createBaseOverview = () => ({
    database: {
        available: false,
        configured: isDatabaseConfigured(),
        errorMessage: null,
        statusLabel: isDatabaseConfigured() ? "Aguardando banco" : "Banco nao configurado"
    },
    generatedAt: new Date().toISOString(),
    generatedAtLabel: formatDateTimeLabel(new Date()),
    lookbackWindowLabel: `Ultimos ${DASHBOARD_LOOKBACK_DAYS} dias`,
    meta: {
        health: getHealthStatus(),
        recentQualitySnapshots: []
    },
    summary: {
        acceptedMetaEventsCount: 0,
        activeAdminSessionsCount: 0,
        failedMetaEventsCount: 0,
        leadEventsCount: 0,
        metaEventsSuccessRatePercentage: 0,
        pageViewEventsCount: 0,
        securityAlertsCount: 0,
        totalMetaEventsCount: 0,
        unauthorizedAccessCount: 0
    },
    trend: {
        dailyActivity: createEmptyDailyActivitySeries().map(dailyActivityItem => ({
            ...dailyActivityItem,
            metaEventsWidthPercentage: 0,
            securityAlertsWidthPercentage: 0
        })),
        eventBreakdown: [],
        recentMetaEvents: [],
        recentSecurityEvents: []
    }
});

const getAdminDashboardOverview = async () => {
    const baseOverview = createBaseOverview();

    if (!baseOverview.database.configured) {
        return baseOverview;
    }

    try {
        const lookbackStartDate = createLookbackStartDate();
        const currentDate = new Date();
        const dashboardData = await runDatabaseOperation(async prismaClient => {
            const [
                totalMetaEventsCount,
                leadEventsCount,
                acceptedMetaEventsCount,
                failedMetaEventsCount,
                pageViewEventsCount,
                activeAdminSessionsCount,
                securityAlertsCount,
                unauthorizedAccessCount,
                recentMetaEvents,
                recentSecurityEvents,
                recentQualitySnapshots,
                lookbackMetaEvents,
                lookbackSecurityEvents
            ] = await Promise.all([
                prismaClient.metaEventLog.count({
                    where: {
                        createdAt: {
                            gte: lookbackStartDate
                        }
                    }
                }),
                prismaClient.metaEventLog.count({
                    where: {
                        createdAt: {
                            gte: lookbackStartDate
                        },
                        eventName: "Lead"
                    }
                }),
                prismaClient.metaEventLog.count({
                    where: {
                        createdAt: {
                            gte: lookbackStartDate
                        },
                        status: "ACCEPTED"
                    }
                }),
                prismaClient.metaEventLog.count({
                    where: {
                        createdAt: {
                            gte: lookbackStartDate
                        },
                        status: {
                            in: FAILED_META_STATUSES
                        }
                    }
                }),
                prismaClient.metaEventLog.count({
                    where: {
                        createdAt: {
                            gte: lookbackStartDate
                        },
                        eventName: "PageView"
                    }
                }),
                prismaClient.adminSession.count({
                    where: {
                        refreshTokenExpiresAt: {
                            gt: currentDate
                        },
                        revokedAt: null
                    }
                }),
                prismaClient.securityAuditLog.count({
                    where: {
                        createdAt: {
                            gte: lookbackStartDate
                        },
                        success: false
                    }
                }),
                prismaClient.securityAuditLog.count({
                    where: {
                        createdAt: {
                            gte: lookbackStartDate
                        },
                        eventType: "ADMIN_UNAUTHORIZED_ACCESS"
                    }
                }),
                prismaClient.metaEventLog.findMany({
                    orderBy: {
                        createdAt: "desc"
                    },
                    select: {
                        contentName: true,
                        createdAt: true,
                        eventName: true,
                        httpStatus: true,
                        id: true,
                        pageType: true,
                        planInterest: true,
                        profile: true,
                        status: true
                    },
                    take: RECENT_META_EVENTS_LIMIT
                }),
                prismaClient.securityAuditLog.findMany({
                    orderBy: {
                        createdAt: "desc"
                    },
                    select: {
                        createdAt: true,
                        dashboardUsername: true,
                        eventType: true,
                        id: true,
                        ipAddress: true,
                        success: true
                    },
                    take: RECENT_SECURITY_EVENTS_LIMIT
                }),
                prismaClient.metaQualitySnapshot.findMany({
                    orderBy: {
                        createdAt: "desc"
                    },
                    select: {
                        createdAt: true,
                        datasetId: true,
                        diagnostics: true,
                        id: true,
                        matchingStatus: true,
                        qualityScore: true,
                        qualityStatus: true,
                        source: true
                    },
                    take: RECENT_QUALITY_SNAPSHOTS_LIMIT
                }),
                prismaClient.metaEventLog.findMany({
                    orderBy: {
                        createdAt: "asc"
                    },
                    select: {
                        createdAt: true,
                        eventName: true
                    },
                    where: {
                        createdAt: {
                            gte: lookbackStartDate
                        }
                    }
                }),
                prismaClient.securityAuditLog.findMany({
                    orderBy: {
                        createdAt: "asc"
                    },
                    select: {
                        createdAt: true,
                        success: true
                    },
                    where: {
                        createdAt: {
                            gte: lookbackStartDate
                        }
                    }
                })
            ]);

            return {
                acceptedMetaEventsCount,
                activeAdminSessionsCount,
                failedMetaEventsCount,
                leadEventsCount,
                lookbackMetaEvents,
                lookbackSecurityEvents,
                pageViewEventsCount,
                recentMetaEvents,
                recentQualitySnapshots,
                recentSecurityEvents,
                securityAlertsCount,
                totalMetaEventsCount,
                unauthorizedAccessCount
            };
        });
        const metaEventsSuccessRatePercentage =
            dashboardData.totalMetaEventsCount > 0
                ? Math.round((dashboardData.acceptedMetaEventsCount / dashboardData.totalMetaEventsCount) * 100)
                : 0;

        return {
            ...baseOverview,
            database: {
                available: true,
                configured: true,
                errorMessage: null,
                statusLabel: "Banco conectado"
            },
            meta: {
                ...baseOverview.meta,
                recentQualitySnapshots: buildRecentQualitySnapshots(dashboardData.recentQualitySnapshots)
            },
            summary: {
                acceptedMetaEventsCount: dashboardData.acceptedMetaEventsCount,
                activeAdminSessionsCount: dashboardData.activeAdminSessionsCount,
                failedMetaEventsCount: dashboardData.failedMetaEventsCount,
                leadEventsCount: dashboardData.leadEventsCount,
                metaEventsSuccessRatePercentage,
                pageViewEventsCount: dashboardData.pageViewEventsCount,
                securityAlertsCount: dashboardData.securityAlertsCount,
                totalMetaEventsCount: dashboardData.totalMetaEventsCount,
                unauthorizedAccessCount: dashboardData.unauthorizedAccessCount
            },
            trend: {
                dailyActivity: buildDailyActivitySeries({
                    metaEventLogs: dashboardData.lookbackMetaEvents,
                    securityAuditLogs: dashboardData.lookbackSecurityEvents
                }),
                eventBreakdown: buildEventBreakdown(dashboardData.lookbackMetaEvents),
                recentMetaEvents: buildRecentMetaEvents(dashboardData.recentMetaEvents),
                recentSecurityEvents: buildRecentSecurityEvents(dashboardData.recentSecurityEvents)
            }
        };
    } catch (error) {
        if (error instanceof DatabaseConfigurationError || error instanceof DatabaseAccessError) {
            return {
                ...baseOverview,
                database: {
                    available: false,
                    configured: true,
                    errorMessage: "Nao foi possivel consultar o PostgreSQL nesta etapa.",
                    statusLabel: "Falha ao consultar o banco"
                }
            };
        }

        throw error;
    }
};

module.exports = {
    getAdminDashboardOverview
};
