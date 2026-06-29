const getRequestIpAddress = req => {
    const forwardedHeader = req.headers["x-forwarded-for"];

    if (typeof forwardedHeader === "string" && forwardedHeader.trim()) {
        return forwardedHeader.split(",")[0].trim();
    }

    return req.ip || "";
};

const getRequestUserAgent = req => req.get("user-agent") || "";

module.exports = {
    getRequestIpAddress,
    getRequestUserAgent
};
