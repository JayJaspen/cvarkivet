-- Karensregeln är borttagen. Den fanns för att hindra företag från att hoppa
-- mellan månads- och årsabonnemang; med ett enda årsabonnemang finns inget att
-- utnyttja. Inget företag hade karens när kolumnen togs bort.
ALTER TABLE "Company" DROP COLUMN "blockedUntil";

-- Månadsabonnemang erbjuds inte längre. Ordningen nedan spelar roll: händelsen
-- loggas medan företagen fortfarande är märkta MONTHLY, så att urvalet blir
-- entydigt. Historiken i SubscriptionEvent rörs i övrigt inte – den ska visa
-- vad som faktiskt hänt.
INSERT INTO "SubscriptionEvent" ("id", "companyId", "type", "plan", "createdAt")
SELECT 'migr_ars_' || "id", "id", 'CHANGED', 'YEARLY_' || "companyType", CURRENT_TIMESTAMP
FROM "Company"
WHERE "subscription" = 'MONTHLY';

-- Befintliga månadskunder flyttas till årsabonnemang, ett år från i dag.
UPDATE "Company"
SET "subscription"        = 'YEARLY',
    "subscriptionStarted" = CURRENT_TIMESTAMP,
    "subscriptionEndsAt"  = CURRENT_TIMESTAMP + INTERVAL '1 year'
WHERE "subscription" = 'MONTHLY';
