const path = require("path");
const express = require("express");
const { ROOT_DIR } = require("./config/env");
const { blockPrivatePaths } = require("./middleware/block-private-paths");
const { metaRouter } = require("./routes/meta");

const createApp = () => {
    const app = express();

    app.set("trust proxy", true);
    app.use(express.json({ limit: "100kb" }));
    app.use(blockPrivatePaths);

    app.use("/api/meta", metaRouter);

    app.get("/", (req, res) => {
        res.sendFile(path.join(ROOT_DIR, "index.html"));
    });

    app.use(express.static(ROOT_DIR, { dotfiles: "ignore" }));

    app.use((req, res) => {
        res.status(404).send("Not found");
    });

    return app;
};

module.exports = {
    createApp
};
