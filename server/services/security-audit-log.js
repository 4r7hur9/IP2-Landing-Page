const { isDatabaseConfigured, runDatabaseOperation } = require("../lib/database");

const recordSecurityAuditEvent = async auditEvent => {
    if (!isDatabaseConfigured()) {
        return null;
    }

    try {
        return await runDatabaseOperation(prismaClient =>
            prismaClient.securityAuditLog.create({
                data: auditEvent
            })
        );
    } catch (error) {
        console.error("Unable to persist security audit event:", error.message);
        return null;
    }
};

module.exports = {
    recordSecurityAuditEvent
};
