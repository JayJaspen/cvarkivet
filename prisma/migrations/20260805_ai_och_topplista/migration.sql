-- AlterTable
-- updatedAt är obligatorisk, men tabellen har redan rader. Kolumnen läggs
-- därför till med ett standardvärde, befintliga annonser får sitt createdAt,
-- och sedan tas standardvärdet bort så att Prisma sköter fältet framåt.
ALTER TABLE "JobAd" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "JobAd" SET "updatedAt" = "createdAt";
ALTER TABLE "JobAd" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "seeking" TEXT;

-- CreateTable
CREATE TABLE "MatchScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobAdId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "motivation" TEXT NOT NULL,
    "cvVersion" TIMESTAMP(3),
    "adVersion" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CvReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "suggestions" TEXT NOT NULL,
    "completeness" INTEGER NOT NULL,
    "cvVersion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CvReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CvDownload" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CvDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchScore_jobAdId_score_idx" ON "MatchScore"("jobAdId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "MatchScore_userId_jobAdId_key" ON "MatchScore"("userId", "jobAdId");

-- CreateIndex
CREATE UNIQUE INDEX "CvReview_userId_key" ON "CvReview"("userId");

-- CreateIndex
CREATE INDEX "CvDownload_userId_idx" ON "CvDownload"("userId");

-- AddForeignKey
ALTER TABLE "MatchScore" ADD CONSTRAINT "MatchScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchScore" ADD CONSTRAINT "MatchScore_jobAdId_fkey" FOREIGN KEY ("jobAdId") REFERENCES "JobAd"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvReview" ADD CONSTRAINT "CvReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvDownload" ADD CONSTRAINT "CvDownload_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvDownload" ADD CONSTRAINT "CvDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

