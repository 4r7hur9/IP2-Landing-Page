const express = require("express");
const { buildMetaEvent } = require("../services/meta-payload");
const { getHealthStatus, isMetaConfigured, sendMetaEvent } = require("../services/meta-conversions");

const router = express.Router();

router.get("/health", (req, res) => {
    res.json(getHealthStatus());
});

router.post("/events", async (req, res) => {
    if (!isMetaConfigured()) {
        res.status(503).json({
            ok: false,
            error: "META_ACCESS_TOKEN not configured"
        });
        return;
    }

    const { eventId, eventName, metaEvent } = buildMetaEvent(req, req.body);

    if (!eventName) {
        res.status(400).json({
            ok: false,
            error: "event_name is required"
        });
        return;
    }

    try {
        const response = await sendMetaEvent(metaEvent);

        if (!response.ok) {
            res.status(response.status).json({
                ok: false,
                error: "Meta API request failed",
                details: response.body
            });
            return;
        }

        res.status(202).json({
            ok: true,
            event_id: eventId,
            details: response.body
        });
    } catch (error) {
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
