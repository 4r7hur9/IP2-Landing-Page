const { PrismaClient } = require("@prisma/client");

class DatabaseConfigurationError extends Error {
    constructor(message) {
        super(message);
        this.name = "DatabaseConfigurationError";
    }
}

class DatabaseAccessError extends Error {
    constructor(message, cause) {
        super(message);
        this.name = "DatabaseAccessError";
        this.cause = cause;
    }
}

let prismaClient;

const isDatabaseConfigured = () => Boolean((process.env.DATABASE_URL || "").trim());

const getPrismaClient = () => {
    if (!isDatabaseConfigured()) {
        throw new DatabaseConfigurationError("DATABASE_URL is not configured.");
    }

    if (!prismaClient) {
        prismaClient = new PrismaClient();
    }

    return prismaClient;
};

const runDatabaseOperation = async operationCallback => {
    try {
        const client = getPrismaClient();
        return await operationCallback(client);
    } catch (error) {
        if (error instanceof DatabaseConfigurationError) {
            throw error;
        }

        throw new DatabaseAccessError("Database operation failed.", error);
    }
};

module.exports = {
    DatabaseAccessError,
    DatabaseConfigurationError,
    getPrismaClient,
    isDatabaseConfigured,
    runDatabaseOperation
};
