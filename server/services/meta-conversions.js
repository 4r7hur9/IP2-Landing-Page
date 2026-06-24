const { META_CONFIG } = require("../config/env");

const getHealthStatus = () => ({
    ok: true,
    pixel_id: META_CONFIG.pixelId,
    api_version: META_CONFIG.apiVersion,
    access_token_configured: Boolean(META_CONFIG.accessToken),
    test_event_code_configured: Boolean(META_CONFIG.testEventCode)
});

const isMetaConfigured = () => Boolean(META_CONFIG.accessToken);

const sendMetaEvent = async metaEvent => {
    const payload = {
        data: [metaEvent]
    };

    if (META_CONFIG.testEventCode) {
        payload.test_event_code = META_CONFIG.testEventCode;
    }

    const metaUrl =
        `https://graph.facebook.com/${META_CONFIG.apiVersion}/${META_CONFIG.pixelId}/events` +
        `?access_token=${encodeURIComponent(META_CONFIG.accessToken)}`;
    const response = await fetch(metaUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });
    const metaResponse = await response.json().catch(() => ({}));

    return {
        ok: response.ok,
        status: response.status,
        body: metaResponse
    };
};

module.exports = {
    getHealthStatus,
    isMetaConfigured,
    sendMetaEvent
};
