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
src/lib/ai.ts             Matchningspoäng och CV-granskning mot Claude
src/lib/matchning.ts      Cachning av matchningspoäng
src/lib/onskelista.ts     Önskade företag, med normalisering av namn
src/lib/topplista.ts      Mest följda företag
src/lib/retention.ts      Gallring av inaktiva konton
src/app/api/cron/         Nattligt gallringsjobb (schemaläggs i vercel.json)
src/components/Skeleton   Laddningsskelett som visas medan servern hämtar data

src/app/actions/          Server actions: auth, user, company, admin
src/app/kandidat/         Lediga jobb · Företag · Mitt CV · Min sida · Meddelanden
src/app/foretag/          CVArkivet · Annonser · Vår sida · Meddelanden
src/app/admin/            Registrerade användare · Registrerade företag
```

---

## Affärsregler i koden

- **Kandidatkonton är aktiva direkt** – ingen verifiering.
- **Företagskonton måste godkännas av admin.** De kan logga in och fylla i sina uppgifter,
  men kommer inte åt CVArkivet, annonser eller prenumeration förrän de är godkända, och
  syns inte för kandidaterna. Admin får mail vid ny registrering, företaget får mail vid
  beslut. Avslag kan motiveras och motiveringen visas för företaget.
- **Företag måste ha egen e-postdomän.** Gmail, Hotmail, Outlook, svenska
  internetleverantörer och engångsadresser blockeras. Listan finns i `src/lib/utils.ts`.
- **Organisationsnumret kontrolleras** med kontrollsiffra, så påhittade nummer avvisas.
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
- **Matchningspoängen** ser bara kompetens och erfarenhet. Ålder, namn, foto och ort skickas
  aldrig till modellen. Poängen sparas och räknas om först när CV:t eller annonsen ändrats,
  och högst 25 kandidater beräknas per klick.
- **Önskelistan**: kandidater föreslår företag som borde finnas här. Namnet normaliseras
  (`Volvo AB`, `volvo` och `VOLVO Aktiebolag` blir samma post). Nya önskemål syns publikt
  först efter admins godkännande, eftersom listan ligger på startsidan. Posten försvinner
  automatiskt när företaget registrerar sig.
- **Nedladdning av CV loggas** och visas för kandidaten under Min sida.
- **Gallring:** konton som varit inaktiva i 24 månader raderas automatiskt av ett cron-jobb
  varje natt. Kandidaten varnas via mail 30 dagar innan och behåller kontot genom att logga
  in. Företagskonton omfattas bara om de saknar prenumeration. Admin kan testköra och köra
  manuellt från *Registrerade användare*.

---

## Prestanda

- **Servern körs i Frankfurt** (`regions` i `vercel.json`) eftersom Neon-databasen ligger i
  eu-central-1. Varje sidvisning gör flera databasfrågor, och med servern i USA korsade
  varje fråga Atlanten. Flyttar du databasen måste servern följa med.
- `vercel.json` är JSON utan kommentarer. Lägg **inte** till egna nycklar som `//` –
  Vercel avvisar hela filen och deployen misslyckas.
- Varje vy har ett `loading.tsx` så att sidan svarar direkt på klicket.
- `requireUser`, `requireCompany` och `requireAdmin` är insvepta i Reacts `cache()`, så att
  layout och sida delar på en databasfråga i stället för att göra samma två gånger.
- Loggning av CV-visningar, företagsbesök och senaste aktivitet skrivs i bakgrunden och
  fördröjer inte svaret.

## Kända begränsningar

- **Betalning sker manuellt.** Företaget väljer paket i systemet, admin fakturerar.
  Ska det automatiseras är Stripe Billing nästa steg.
- **Ingen sökbevakning.** Kandidater får inga mail om nya matchande annonser.
- **Ingen bildbeskärning** vid logotypuppladdning – filen sparas som den är.
- **Ingen tvåfaktorsautentisering** för admin.
