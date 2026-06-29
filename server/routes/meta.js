const crypto = require("crypto");
const express = require("express");
const { buildMetaEvent } = require("../services/meta-payload");
const { recordMetaEventAttempt } = require("../services/meta-event-log");
const { getHealthStatus, isMetaConfigured, sendMetaEvent } = require("../services/meta-conversions");
const { getRequestIpAddress, getRequestUserAgent } = require("../utils/request-metadata");

const router = express.Router();

router.get("/health", (req, res) => {
    res.json(getHealthStatus());
});

router.post("/events", async (req, res) => {
    const requestIpAddress = getRequestIpAddress(req);
    const requestUserAgent = getRequestUserAgent(req);
    const fallbackEventId = crypto.randomUUID();

    if (!isMetaConfigured()) {
        await recordMetaEventAttempt({
            customData: req.body && typeof req.body.custom_data === "object" ? req.body.custom_data : {},
            errorMessage: "META_ACCESS_TOKEN not configured",
            eventId: req.body && typeof req.body.event_id === "string" ? req.body.event_id : fallbackEventId,
            eventName: req.body && typeof req.body.event_name === "string" ? req.body.event_name : "unknown_event",
            eventSourceUrl:
                req.body && typeof req.body.event_source_url === "string" ? req.body.event_source_url : "",
            httpStatus: 503,
            ipAddress: requestIpAddress,
            status: "CONFIGURATION_ERROR",
            userAgent: requestUserAgent
        });
        res.status(503).json({
            ok: false,
            error: "META_ACCESS_TOKEN not configured"
        });
        return;
    }

    const { customData, eventId, eventName, metaEvent } = buildMetaEvent(req, req.body);

    if (!eventName) {
        await recordMetaEventAttempt({
            customData,
            errorMessage: "event_name is required",
            eventId,
            eventName: "unknown_event",
            eventSourceUrl:
                req.body && typeof req.body.event_source_url === "string" ? req.body.event_source_url : "",
            httpStatus: 400,
            ipAddress: requestIpAddress,
            status: "VALIDATION_ERROR",
            userAgent: requestUserAgent
        });
        res.status(400).json({
            ok: false,
            error: "event_name is required"
        });
        return;
    }

    try {
        const response = await sendMetaEvent(metaEvent);

        if (!response.ok) {
            await recordMetaEventAttempt({
                customData,
                errorMessage: "Meta API request failed",
                eventId,
                eventName,
                eventSourceUrl: metaEvent.event_source_url || "",
                httpStatus: response.status,
                ipAddress: requestIpAddress,
                metaResponse: response.body,
                status: "FAILED",
                userAgent: requestUserAgent
            });
            res.status(response.status).json({
                ok: false,
                error: "Meta API request failed",
                details: response.body
            });
            return;
        }

        await recordMetaEventAttempt({
            customData,
            eventId,
            eventName,
            eventSourceUrl: metaEvent.event_source_url || "",
            httpStatus: response.status,
            ipAddress: requestIpAddress,
            metaResponse: response.body,
            status: "ACCEPTED",
            userAgent: requestUserAgent
        });
        res.status(202).json({
            ok: true,
            event_id: eventId,
            details: response.body
        });
    } catch (error) {
        await recordMetaEventAttempt({
            customData,
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            eventId,
            eventName,
            eventSourceUrl: metaEvent.event_source_url || "",
            httpStatus: 502,
            ipAddress: requestIpAddress,
            status: "REQUEST_ERROR",
            userAgent: requestUserAgent
        });
        res.status(502).json({
            ok: false,
            error: "Unable to reach Meta API",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

module.exports = {
    metaRouter: router
};
