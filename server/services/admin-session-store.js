const crypto = require("crypto");
const { runDatabaseOperation } = require("../lib/database");

const hashRefreshToken = refreshToken =>
    crypto.createHash("sha256").update(String(refreshToken || "")).digest("hex");

const createAdminSessionRecord = async sessionData =>
    runDatabaseOperation(prismaClient =>
        prismaClient.adminSession.create({
            data: sessionData
        })
    );

const findAdminSessionById = async sessionId =>
    runDatabaseOperation(prismaClient =>
        prismaClient.adminSession.findUnique({
            where: {
                id: sessionId
            }
        })
    );

const rotateAdminSessionRefreshToken = async ({ refreshToken, refreshTokenExpiresAt, sessionId }) =>
    runDatabaseOperation(prismaClient =>
        prismaClient.adminSession.update({
            data: {
                lastUsedAt: new Date(),
                refreshTokenExpiresAt,
                refreshTokenHash: hashRefreshToken(refreshToken)
            },
            where: {
                id: sessionId
            }
        })
    );

const revokeAdminSessionById = async sessionId =>
    runDatabaseOperation(prismaClient =>
        prismaClient.adminSession.updateMany({
            data: {
                revokedAt: new Date()
            },
            where: {
                id: sessionId,
                revokedAt: null
            }
        })
    );

const touchAdminSession = async sessionId =>
    runDatabaseOperation(prismaClient =>
        prismaClient.adminSession.updateMany({
            data: {
                lastUsedAt: new Date()
            },
            where: {
                id: sessionId,
                revokedAt: null
            }
        })
    );

module.exports = {
    createAdminSessionRecord,
    findAdminSessionById,
    hashRefreshToken,
    revokeAdminSessionById,
    rotateAdminSessionRefreshToken,
    touchAdminSession
};
