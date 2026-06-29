const { isDatabaseConfigured, runDatabaseOperation } = require("../lib/database");

const createMetaQualitySnapshot = async snapshotData => {
    if (!isDatabaseConfigured()) {
        return null;
    }

    try {
        return await runDatabaseOperation(prismaClient =>
            prismaClient.metaQualitySnapshot.create({
                data: snapshotData
            })
        );
    } catch (error) {
        console.error("Unable to persist Meta quality snapshot:", error.message);
        return null;
    }
};

module.exports = {
    createMetaQualitySnapshot
};
