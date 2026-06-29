-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SecurityAuditEventType" AS ENUM ('ADMIN_LOGIN_SUCCESS', 'ADMIN_LOGIN_FAILURE', 'ADMIN_LOGOUT', 'ADMIN_SESSION_REFRESH', 'ADMIN_SESSION_REVOKED', 'ADMIN_UNAUTHORIZED_ACCESS');

-- CreateEnum
CREATE TYPE "MetaEventDeliveryStatus" AS ENUM ('ACCEPTED', 'FAILED', 'CONFIGURATION_ERROR', 'REQUEST_ERROR', 'VALIDATION_ERROR');

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "dashboardUsername" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "refreshTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAuditLog" (
    "id" TEXT NOT NULL,
    "eventType" "SecurityAuditEventType" NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "dashboardUsername" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaEventLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventSourceUrl" TEXT,
    "pageType" TEXT,
    "contentName" TEXT,
    "contentCategory" TEXT,
    "planInterest" TEXT,
    "profile" TEXT,
    "status" "MetaEventDeliveryStatus" NOT NULL,
    "httpStatus" INTEGER,
    "errorMessage" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metaResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaQualitySnapshot" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "qualityScore" INTEGER,
    "qualityStatus" TEXT,
    "matchingStatus" TEXT,
    "diagnostics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetaQualitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminSession_dashboardUsername_idx" ON "AdminSession"("dashboardUsername");

-- CreateIndex
CREATE INDEX "AdminSession_refreshTokenExpiresAt_idx" ON "AdminSession"("refreshTokenExpiresAt");

-- CreateIndex
CREATE INDEX "AdminSession_revokedAt_idx" ON "AdminSession"("revokedAt");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_eventType_createdAt_idx" ON "SecurityAuditLog"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_dashboardUsername_createdAt_idx" ON "SecurityAuditLog"("dashboardUsername", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MetaEventLog_eventId_key" ON "MetaEventLog"("eventId");

-- CreateIndex
CREATE INDEX "MetaEventLog_status_createdAt_idx" ON "MetaEventLog"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MetaEventLog_eventName_createdAt_idx" ON "MetaEventLog"("eventName", "createdAt");

-- CreateIndex
CREATE INDEX "MetaEventLog_pageType_createdAt_idx" ON "MetaEventLog"("pageType", "createdAt");

-- CreateIndex
CREATE INDEX "MetaQualitySnapshot_createdAt_idx" ON "MetaQualitySnapshot"("createdAt");

-- AddForeignKey
ALTER TABLE "SecurityAuditLog" ADD CONSTRAINT "SecurityAuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AdminSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

