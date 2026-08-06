-- Loggning av varje AI-anrop, för att kostnaden ska gå att följa i kronor.
-- Ingen relation till User/Company: historiken ska överleva gallringen.
CREATE TABLE "AiAnrop" (
    "id" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "modell" TEXT NOT NULL,
    "inTokens" INTEGER NOT NULL DEFAULT 0,
    "utTokens" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "companyId" TEXT,
    "lyckades" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAnrop_pkey" PRIMARY KEY ("id")
);

-- Driftinställningar som admin styr utan ny driftsättning. I dag nödstoppet för AI.
CREATE TABLE "Installning" (
    "nyckel" TEXT NOT NULL,
    "varde" TEXT NOT NULL,
    "andradAv" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installning_pkey" PRIMARY KEY ("nyckel")
);

-- Index för dygnskvoterna och för adminvyns summeringar
CREATE INDEX "AiAnrop_createdAt_idx" ON "AiAnrop"("createdAt");
CREATE INDEX "AiAnrop_userId_typ_createdAt_idx" ON "AiAnrop"("userId", "typ", "createdAt");
CREATE INDEX "AiAnrop_companyId_createdAt_idx" ON "AiAnrop"("companyId", "createdAt");
