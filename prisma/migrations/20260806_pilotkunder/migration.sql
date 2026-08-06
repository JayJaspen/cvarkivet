-- Pilotkunder: full åtkomst utan att debiteras.
--
-- Tomt pilotUntil betyder tills vidare. Ett passerat datum stänger åtkomsten
-- på samma sätt som ett utgånget abonnemang. pilotNote syns bara för admin.
--
-- Pilotkunder filtreras bort ur faktureringsunderlaget och ur beståndets
-- årsvärde, så att intäktssiffran inte räknar in pengar som aldrig kommer in.
ALTER TABLE "Company"
  ADD COLUMN "isPilot"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "pilotUntil" TIMESTAMP(3),
  ADD COLUMN "pilotNote"  TEXT;
