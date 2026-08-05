-- Ny prismodell: priset avgörs av bolagstyp (arbetsgivare eller bemanning)
-- och betalningsperiod (år eller månad) i stället för av vilket paket man valt.

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "companyType" TEXT NOT NULL DEFAULT 'EMPLOYER',
ADD COLUMN     "subscriptionEndsAt" TIMESTAMP(3);

-- Flytta över befintliga kunder till den nya modellen.
-- Både CV och CV_ADS blir månadsabonnemang, så att ingen tappar åtkomst vid
-- driftsättningen. De väljer själva om de vill gå över till årsabonnemang.
UPDATE "Company"
SET "subscription" = 'MONTHLY'
WHERE "subscription" IN ('CV', 'CV_ADS');
