const path = require("path");
const express = require("express");
const { APP_CONFIG, ROOT_DIR } = require("./config/env");
const cookieParser = require("cookie-parser");
const { blockPrivatePaths } = require("./middleware/block-private-paths");
const {
    adminApiRateLimiter,
    applyAdminSecurityHeaders,
    applyGlobalSecurityHeaders,
    globalRateLimiter
} = require("./middleware/security");
const { adminApiRouter } = require("./routes/admin-api");
const { adminAuthRouter } = require("./routes/admin-auth");
const { adminPageRouter } = require("./routes/admin-pages");
const { metaRouter } = require("./routes/meta");

const createApp = () => {
    const app = express();
    const servePublicFile = fileName => (req, res) => {
        res.sendFile(path.join(ROOT_DIR, fileName));
    };

    app.set("trust proxy", APP_CONFIG.trustProxy);
    app.set("view engine", "ejs");
    app.set("views", path.join(ROOT_DIR, "views"));
    app.disable("x-powered-by");

    app.use(applyGlobalSecurityHeaders);
    app.use(globalRateLimiter);
    app.use(express.json({ limit: "100kb" }));
    app.use(express.urlencoded({ extended: false, limit: "10kb" }));
    app.use(cookieParser());
    app.use(blockPrivatePaths);

    app.use("/admin", applyAdminSecurityHeaders, adminAuthRouter);
    app.use("/admin", applyAdminSecurityHeaders, adminPageRouter);
    app.use("/api/admin", applyAdminSecurityHeaders, adminApiRateLimiter, adminApiRouter);
    app.use("/api/meta", metaRouter);

    app.get(["/", "/index.html"], servePublicFile("index.html"));
    app.get(["/contato", "/contato.html"], servePublicFile("contato.html"));
    app.get(
        ["/politica-de-privacidade", "/politicadeprivacidade", "/politicadeprivacidade.html"],
        servePublicFile("politicadeprivacidade.html")
    );

    app.use(express.static(ROOT_DIR, { dotfiles: "ignore" }));

    app.use((req, res) => {
        res.status(404).send("Not found");
    });

    return app;
};

module.exports = {
    createApp
};
