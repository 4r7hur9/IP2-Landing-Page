const crypto = require("crypto");
const { cleanText, normalizeEmail, normalizePhone, splitName } = require("../utils/normalize");

const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

const buildFbc = (fbc, fbclid) => {
    if (fbc) {
        return fbc;
    }

    if (!fbclid) {
        return "";
    }

    return `fb.1.${Date.now()}.${fbclid}`;
};

const getClientIp = req => {
    const forwarded = req.headers["x-forwarded-for"];

    if (typeof forwarded === "string" && forwarded) {
        return forwarded.split(",")[0].trim();
    }

    return req.ip || "";
};

const pickCustomData = payload => {
    const source = payload && typeof payload.custom_data === "object" ? payload.custom_data : {};
    const allowedKeys = ["content_name", "content_category", "page_type", "status", "plan_interest", "profile"];
    const customData = {};

    for (const key of allowedKeys) {
        const value = source[key];

        if (typeof value === "string") {
            const normalized = cleanText(value, 120);

            if (normalized) {
                customData[key] = normalized;
            }
        } else if (typeof value === "number" || typeof value === "boolean") {
            customData[key] = value;
        }
    }

    return customData;
};

const buildUserData = (req, payload) => {
    const source = payload && typeof payload.user_data === "object" ? payload.user_data : {};
    const email = normalizeEmail(source.email);
    const phone = normalizePhone(source.phone);
    const { firstName, lastName } = splitName(source.name);
    const userData = {
        client_ip_address: getClientIp(req),
        client_user_agent: req.get("user-agent") || undefined,
        fbc: buildFbc(cleanText(source.fbc, 300), cleanText(source.fbclid, 300)) || undefined,
        fbp: cleanText(source.fbp, 300) || undefined
    };

    if (email) {
        userData.em = [sha256(email)];
    }

    if (phone) {
        userData.ph = [sha256(phone)];
    }

    if (firstName) {
        userData.fn = [sha256(firstName)];
    }

    if (lastName) {
        userData.ln = [sha256(lastName)];
    }

    if (email || phone) {
        userData.external_id = [sha256(email || phone)];
    }

    return Object.fromEntries(
        Object.entries(userData).filter(([, value]) => {
            if (Array.isArray(value)) {
                return value.length > 0;
            }

            return Boolean(value);
        })
    );
};

const buildMetaEvent = (req, payload) => {
    const eventName = cleanText(payload.event_name, 100);
    const eventId = cleanText(payload.event_id, 150) || crypto.randomUUID();
    const eventSourceUrl = cleanText(payload.event_source_url, 1000);
    const rawEventTime = Number(payload.event_time);
    const metaEvent = {
        event_name: eventName,
        event_time: Number.isFinite(rawEventTime) ? Math.round(rawEventTime) : Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: eventSourceUrl || undefined,
        user_data: buildUserData(req, payload)
    };
    const customData = pickCustomData(payload);

    if (Object.keys(customData).length > 0) {
        metaEvent.custom_data = customData;
    }

    return {
        eventId,
        eventName,
        metaEvent
    };
};

module.exports = {
    buildMetaEvent
};
