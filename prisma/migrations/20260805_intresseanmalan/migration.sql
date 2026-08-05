-- Application (kandidatens privata "markerad som ansökt") ersätts av
-- Interest (intresseanmälan som företaget ser). Befintliga rader flyttas över
-- så att ingenting går förlorat.

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobAdId" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Interest_jobAdId_idx" ON "Interest"("jobAdId");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_userId_jobAdId_key" ON "Interest"("userId", "jobAdId");

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_jobAdId_fkey" FOREIGN KEY ("jobAdId") REFERENCES "JobAd"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Flytta över befintliga markeringar till intresseanmälningar
INSERT INTO "Interest" ("id", "userId", "jobAdId", "createdAt")
SELECT "id", "userId", "jobAdId", "createdAt" FROM "Application";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_jobAdId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_userId_fkey";

-- DropTable
DROP TABLE "Application";
