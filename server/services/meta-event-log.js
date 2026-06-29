const { isDatabaseConfigured, runDatabaseOperation } = require("../lib/database");

const normalizeMetaResponse = metaResponse =>
    metaResponse && typeof metaResponse === "object" ? metaResponse : undefined;

const upsertMetaEventLog = async logData => {
    if (!isDatabaseConfigured()) {
        return null;
    }

    try {
        return await runDatabaseOperation(prismaClient =>
            prismaClient.metaEventLog.upsert({
                create: logData,
                update: {
                    contentCategory: logData.contentCategory,
                    contentName: logData.contentName,
                    errorMessage: logData.errorMessage,
                    eventSourceUrl: logData.eventSourceUrl,
                    httpStatus: logData.httpStatus,
                    ipAddress: logData.ipAddress,
                    metaResponse: logData.metaResponse,
                    pageType: logData.pageType,
                    planInterest: logData.planInterest,
                    profile: logData.profile,
                    status: logData.status,
                    userAgent: logData.userAgent
                },
                where: {
                    eventId: logData.eventId
                }
            })
        );
    } catch (error) {
        console.error("Unable to persist Meta event log:", error.message);
        return null;
    }
};

const recordMetaEventAttempt = async ({
    customData = {},
    errorMessage = "",
    eventId,
    eventName,
    eventSourceUrl = "",
    httpStatus,
    ipAddress = "",
    metaResponse,
    status,
    userAgent = ""
}) =>
    upsertMetaEventLog({
        contentCategory: customData.content_category || null,
        contentName: customData.content_name || null,
        errorMessage: errorMessage || null,
        eventId,
        eventName: eventName || "unknown_event",
        eventSourceUrl: eventSourceUrl || null,
        httpStatus: Number.isFinite(httpStatus) ? httpStatus : null,
        ipAddress: ipAddress || null,
        metaResponse: normalizeMetaResponse(metaResponse),
        pageType: customData.page_type || null,
        planInterest: customData.plan_interest || null,
        profile: customData.profile || null,
        status,
        userAgent: userAgent || null
    });

module.exports = {
    recordMetaEventAttempt
};
