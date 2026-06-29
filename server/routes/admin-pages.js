const express = require("express");
const { requireAdminSession } = require("../middleware/require-admin-session");

const router = express.Router();

router.get("/", requireAdminSession, (req, res) => {
    res.render("pages/admin-dashboard", {
        dashboardUsername: req.adminSession.dashboardUsername,
        pageTitle: "Dashboard Interna | IP2",
        sessionExpiresAt: req.adminSession.expiresAt,
        sessionIssuedAt: req.adminSession.issuedAt,
        sessionWasRefreshed: req.adminSessionWasRefreshed
    });
});

module.exports = {
    adminPageRouter: router
};
