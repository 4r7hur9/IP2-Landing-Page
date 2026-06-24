const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const PORT = Number(process.env.PORT || 3000);

const META_CONFIG = {
    pixelId: process.env.META_PIXEL_ID || "1955246271821508",
    accessToken: (process.env.META_ACCESS_TOKEN || "").trim(),
    apiVersion: (process.env.META_API_VERSION || "v25.0").trim(),
    testEventCode: (process.env.META_TEST_EVENT_CODE || "").trim()
};

module.exports = {
    META_CONFIG,
    PORT,
    ROOT_DIR
};
