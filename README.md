# CVArkivet.se

Jobbmarknadsplats med tre roller: **kandidat**, **företag** och **admin**.
Next.js 14 (App Router), TypeScript, Prisma, PostgreSQL och Tailwind.

- **Återupptar du arbetet efter en paus?** Börja i [STATUS.md](./STATUS.md).
- **Ska du sätta sajten live?** Följ [DRIFTSATTNING.md](./DRIFTSATTNING.md).

---

## Kör lokalt

Projektet är redan installerat och en SQLite-databas med testdata ligger klar:

```bash
npm run dev:sqlite        # http://localhost:3000
```

Vill du köra mot Postgres i stället, lägg din anslutningssträng i `.env` som
`DATABASE_URL`, ta bort `DATABASE_PROVIDER`, och kör:

```bash
npm run db:migrate
npm run dev
```

Behöver du bygga om den lokala testdatabasen från grunden:

```bash
npm run sqlite:setup
```

### Testinloggningar (lösenord: `losenord123`)

| Roll | E-post | Not |
|---|---|---|
| Admin | admin@cvarkivet.se | |
| Företag | rekrytering@nordisklogistik.se | CV + Annonspaket |
| Företag | jobb@byggpartnervast.se | Endast CV-prenumeration |
| Företag | hr@ab.se | Ingen prenumeration – visar paywall |
| Kandidat | johan@example.se | Har blockerat domänen ab.se |
| Kandidat | sara@example.se, ali@example.se, emma@example.se | |

Utan `RESEND_API_KEY` skickas inga mail – de skrivs ut i terminalen i stället.
Praktiskt vid utveckling: du kan kopiera återställningslänken därifrån.

---

## Struktur

```
prisma/schema.prisma      Datamodell (PostgreSQL)
prisma/seed.ts            Testdata
scripts/                  Genererar SQLite-varianten för lokal utveckling

src/lib/data.ts           290 kommuner, 28 jobbkategorier, prenumerationsplaner
src/lib/session.ts        Inloggning (JWT i httpOnly-cookie)
src/lib/visibility.ts     Dolda profiler – per företag och per e-postdomän
src/lib/email.ts          Mallar och utskick via Resend
src/lib/notifications.ts  Notis när ett företag läst ett CV
src/lib/storage.ts        Logotyper: Vercel Blob i drift, disk lokalt
src/lib/search.ts         Skiftlägesokänslig sökning
src/lib/retention.ts      Gallring av inaktiva konton
src/app/api/cron/         Nattligt gallringsjobb (schemaläggs i vercel.json)

src/app/actions/          Server actions: auth, user, company, admin
src/app/kandidat/         Lediga jobb · Företag · Mitt CV · Min sida · Meddelanden
src/app/foretag/          CVArkivet · Annonser · Vår sida · Meddelanden
src/app/admin/            Registrerade användare · Registrerade företag
```

---

## Affärsregler i koden

- Konton är **aktiva direkt** – ingen verifiering, varken för kandidater eller företag.
- Företag utan prenumeration möts av en **paywall** i stället för CVArkivet och Annonser.
- **CV-prenumeration 299 kr/mån** ger CVArkivet.
  **CV + Annonspaket 499 kr/mån** ger även annonsering. Priser exklusive moms.
- **Uppsägning ger 2 månaders karens.** Företaget kan inte teckna ny prenumeration under
  tiden, och kan inte heller kringgå det genom att registrera ett nytt konto på samma
  e-postdomän. Admin kan häva karensen manuellt.
- **Utgångna annonser** försvinner för kandidater men ligger kvar hos företaget tills de
  raderas manuellt.
- **Dolda profiler:** en kandidat kan dölja sig för ett enskilt företag eller för en hel
  e-postdomän. Dolda kandidater filtreras bort i både träfflistan och detaljvyn.
- **Loggning:** varje gång ett företag öppnar ett CV skapas en `CvView` och kandidaten
  får ett mail (max ett per dygn och företag, går att stänga av). Varje gång en kandidat
  öppnar en företagsprofil skapas en `CompanyVisit`. Båda syns för admin.
- **Personnummer lagras inte** – bara födelsedatum, och företagen ser enbart åldern.
- **Gallring:** konton som varit inaktiva i 24 månader raderas automatiskt av ett cron-jobb
  varje natt. Kandidaten varnas via mail 30 dagar innan och behåller kontot genom att logga
  in. Företagskonton omfattas bara om de saknar prenumeration. Admin kan testköra och köra
  manuellt från *Registrerade användare*.

---

## Kända begränsningar

- **Betalning sker manuellt.** Företaget väljer paket i systemet, admin fakturerar.
  Ska det automatiseras är Stripe Billing nästa steg.
- **Ingen sökbevakning.** Kandidater får inga mail om nya matchande annonser.
- **Ingen bildbeskärning** vid logotypuppladdning – filen sparas som den är.
- **Ingen tvåfaktorsautentisering** för admin.
