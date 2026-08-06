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
| Företag | rekrytering@nordisklogistik.se | Aktivt årsabonnemang |
| Företag | jobb@byggpartnervast.se | Aktivt årsabonnemang |
| Företag | hr@ab.se | Inget abonnemang – visar förhandsvisningen |
| Kandidat | johan@example.se | Har blockerat domänen ab.se |
| Kandidat | sara@example.se, ali@example.se, emma@example.se | |

Utan `RESEND_API_KEY` skickas inga mail – de skrivs ut i terminalen i stället.
Praktiskt vid utveckling: du kan kopiera återställningslänken därifrån.

---

## Struktur

```
prisma/schema.prisma      Datamodell (PostgreSQL)
prisma/seed.ts            Testdata
scripts/make-sqlite-schema.mjs  Genererar SQLite-varianten för lokal utveckling
scripts/admin.mjs         Återställer adminlösenord – enda vägen in om du blir utelåst

src/lib/data.ts           290 kommuner, 28 jobbkategorier, prenumerationsplaner
src/lib/session.ts        Inloggning (JWT i httpOnly-cookie)
src/lib/visibility.ts     Dolda profiler – per företag och per e-postdomän
src/lib/email.ts          Mallar och utskick via Resend
src/lib/notifications.ts  Notis när ett företag läst ett CV
src/lib/storage.ts        Logotyper: Vercel Blob i drift, disk lokalt
src/lib/search.ts         Skiftlägesokänslig sökning
src/lib/cv.ts             Vad som räknas som ett ifyllt CV
src/lib/ai.ts             Matchningspoäng och CV-granskning mot Claude, samt prislista
src/lib/ai-kvot.ts        Dygnskvoter, nödstopp och kostnadsloggning
src/lib/matchning.ts      Cachning av matchningspoäng
src/lib/onskelista.ts     Önskade företag, med normalisering av namn
src/lib/topplista.ts      Mest följda företag
src/lib/retention.ts      Gallring av inaktiva konton
src/app/api/cron/         Nattligt gallringsjobb (schemaläggs i vercel.json)
src/components/Skeleton   Laddningsskelett som visas medan servern hämtar data

src/app/actions/          Server actions: auth, user, company, admin
src/app/kandidat/         Lediga jobb · Företag · Mitt CV · Min sida · Meddelanden
src/app/foretag/          CVArkivet · Annonser · Vår sida · Meddelanden
src/app/admin/            Registrerade användare · Registrerade företag · AI-förbrukning
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
- **Ett enda abonnemang: helår.** 4 990 kr/år för arbetsgivare, 9 990 kr/år för bemannings-
  och rekryteringsföretag, exklusive moms. Månadsbetalning togs bort i augusti 2026; äldre
  poster i `SubscriptionEvent` kan fortfarande vara märkta `MONTHLY`, så läsande kod måste
  tåla det.
- **Företag utan abonnemang ser en förhandsvisning** med tre anonymiserade kandidater
  (`src/components/Forhandsvisning.tsx`) i stället för en tom paywall. Inga namn, foton,
  kontaktuppgifter eller löneanspråk, ingen länk in i CV:t och ingen `CvView` loggas –
  kandidaten ska inte få mail om att någon läst CV:t när ingen faktiskt gjort det.
  Kandidater som dolt sig för företaget filtreras bort även här.
- **Pilotkunder** (`isPilot`) får full åtkomst utan att debiteras. Sätts av admin på företagets
  sida, med valfritt slutdatum och en anteckning. De filtreras bort ur faktureringsunderlaget,
  ur CSV-exporten och ur beståndets årsvärde – annars skulle intäktssiffran ljuga – och undantas
  från gallringen av inaktiva konton. Tomt slutdatum betyder tills vidare; ett passerat datum
  stänger åtkomsten precis som ett utgånget abonnemang.
- **Uppsägning betyder att abonnemanget inte förnyas.** Åtkomsten löper till slutdatumet,
  som är betalt i förskott. Ingen återbetalning, och ingen karens – karensregeln togs bort
  i augusti 2026 när det bara fanns ett abonnemang kvar att välja på.
- **Utgångna annonser** försvinner för kandidater men ligger kvar hos företaget tills de
  raderas manuellt.
- **Dolda profiler:** en kandidat kan dölja sig för ett enskilt företag eller för en hel
  e-postdomän. Dolda kandidater filtreras bort i både träfflistan och detaljvyn.
- **Tomma CV:** ett konto utan yrkesrubrik, presentation, kompetenser, erfarenhet, utbildning
  eller kategori räknas som tomt (`src/lib/cv.ts`). Företag kan dölja dem i sökningen, och de
  märks upp med *Tomt CV* i listan även när de visas. Att `cvUpdatedAt` är satt duger inte som
  mått – den sätts även när någon sparar ett helt tomt formulär.
- **Notiser i sidomenyn:** siffrorna räknas fram i `layout.tsx`, och Next.js återanvänder
  layouten vid klientnavigering. En sida som markerar något som läst måste därför rendera
  `<UppdateraMeny />` (`src/components/UppdateraMeny.tsx`), annars ligger siffran kvar trots
  att databasen är uppdaterad. Komponenten renderas bara när något faktiskt markerades, så
  den kan inte loopa.
- **Filter som använder `OR` måste ligga i `AND`.** Kommunfilter och fritextsökning bygger båda
  ett `OR`. Läggs de som syskonnycklar i samma `where`-objekt skriver den ena tyst över den
  andra, och användaren får fler träffar än hen bad om utan att något syns.
- **Loggning:** varje gång ett företag öppnar ett CV skapas en `CvView` och kandidaten
  får ett mail (max ett per dygn och företag, går att stänga av). Varje gång en kandidat
  öppnar en företagsprofil skapas en `CompanyVisit`. Båda syns för admin.
- **Lösenord kontrolleras mot kända dataintrång** (`src/lib/losenord.ts`) vid registrering,
  byte och återställning. Uppslaget görs mot Have I Been Pwned med k-anonymitet: vi skickar
  de fem första tecknen av lösenordets SHA-1-hash och jämför resten lokalt, så lösenordet
  lämnar aldrig servern. Svarar tjänsten inte släpps lösenordet igenom – ett externt API som
  ligger nere ska inte hindra någon från att skapa konto. Minsta längd är 10 tecken, och
  lösenordet får inte innehålla namn, e-postadress eller företagsnamn. Lagring sker med
  bcrypt, kostnad 12.
- **Personnummer lagras inte** – bara födelsedatum, och företagen ser enbart åldern.
- **Matchningspoängen** ser bara kompetens och erfarenhet. Ålder, namn, foto och ort skickas
  aldrig till modellen. Poängen sparas och räknas om först när CV:t eller annonsen ändrats,
  och högst 25 kandidater beräknas per klick.
- **Inget AI-anrop sker automatiskt.** Varje anrop mot Claude kostar pengar och utlöses därför
  bara av ett klick – aldrig av en sidvisning, en inloggning eller ett schemalagt jobb. Alla
  anrop går genom `src/app/actions/ai.ts`, som kontrollerar kvoten *innan* något skickas iväg.
  Utöver det finns dygnskvoter per kandidat och företag, ett tak för hela sajten, och ett
  nödstopp som admin slår av under *AI-förbrukning*. Varje anrop loggas i `AiAnrop` med
  verklig tokenförbrukning från API-svaret, så att kostnaden går att följa i kronor.
- **Önskelistan**: kandidater föreslår företag som borde finnas här. Namnet normaliseras
  (`Volvo AB`, `volvo` och `VOLVO Aktiebolag` blir samma post). Nya önskemål syns publikt
  först efter admins godkännande, eftersom listan ligger på startsidan. Posten försvinner
  automatiskt när företaget registrerar sig.
- **Nedladdning av CV loggas** och visas för kandidaten under Min sida.
- **Dataportabilitet:** kandidaten laddar ner allt vi har om hen som JSON från Min sida
  (`src/app/kandidat/export/route.ts`). Krävs enligt artikel 20 i GDPR, och gör att ingen
  behöver mejla support för att få ut sina uppgifter.
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
- **Ingen tvåfaktorsautentisering** för admin. Skyddet ligger i stället på Neon- och
  Vercel-kontot, som är det som faktiskt kan återställa allt. Sätt tvåfaktor där.
- **Adminlösenord återställs inte via mail**, utan med `npm run admin`. Se STATUS.md.
