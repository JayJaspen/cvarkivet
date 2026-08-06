-- CreateTable
CREATE TABLE "CompanyWish" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fulfilledAt" TIMESTAMP(3),
    "fulfilledByCompanyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyWish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyWishVote" (
    "id" TEXT NOT NULL,
    "wishId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyWishVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyWish_slug_key" ON "CompanyWish"("slug");

-- CreateIndex
CREATE INDEX "CompanyWish_status_fulfilledAt_idx" ON "CompanyWish"("status", "fulfilledAt");

-- CreateIndex
CREATE INDEX "CompanyWishVote_userId_idx" ON "CompanyWishVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyWishVote_wishId_userId_key" ON "CompanyWishVote"("wishId", "userId");

-- AddForeignKey
ALTER TABLE "CompanyWishVote" ADD CONSTRAINT "CompanyWishVote_wishId_fkey" FOREIGN KEY ("wishId") REFERENCES "CompanyWish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyWishVote" ADD CONSTRAINT "CompanyWishVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

