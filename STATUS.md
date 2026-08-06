# Status och nästa steg

Senast uppdaterad: **6 augusti 2026**

> **Sajten är live på https://cvarkivet.se** med giltigt SSL.
> www skickas vidare till huvudadressen, http går över till https.
> Varje push till `main` driftsätts automatiskt av Vercel.

Den här filen finns för att du – eller en ny person, eller en AI-assistent – ska kunna
komma tillbaka in i projektet efter en paus och ha hela bilden på tio minuter.
Teknisk översikt finns i [README.md](./README.md), lanseringssteg i
[DRIFTSATTNING.md](./DRIFTSATTNING.md).

---

## ⚠️ Måste lösas innan riktiga användare släpps in

Sajten är i drift och har riktiga konton, men fyra saker är fortfarande öppna.

1. **E-post fungerar inte alls.** MX-posten för cvarkivet.se är en null-MX, vilket
   uttryckligen talar om för avsändare att domänen inte tar emot mail. Det finns varken
   SPF eller DMARC. Följden är att `support@cvarkivet.se` studsar trots att adressen står
   i villkoren och integritetspolicyn, *och* att Resend inte är kopplat – så inget mail
   skickas heller. Ingen lösenordsåterställning, inga notiser, inga besked till företag
   om godkännande. **Detta är den enskilt största blockeraren.** Åtgärd: aktivera e-post
   hos one.com eller peka MX mot annan leverantör, och lägg samtidigt in Resends
   DNS-poster.
2. **Vercel Hobby tillåter inte kommersiell användning.** Du har redan betalande kunder,
   så du bryter mot villkoren just nu. Uppgradera till Pro, ca 20 USD/mån.
3. **Databasen saknar backup.** Neon free tier har ingen point-in-time restore. Går
   databasen förlorad finns ingen väg tillbaka.
4. **Du kan låsa ut dig själv.** Ett adminkonto, ingen mailåterställning. Se avsnittet
   *Om du blir utelåst* längst ned – och sätt tvåfaktor på ditt Neon- och Vercel-konto,
   för det är de som i praktiken är huvudnyckeln till hela systemet.

Ej blockerande men värt att veta:

- **`ANTHROPIC_API_KEY` är inte satt**, så matchning och CV-granskning är avstängda och
  osynliga för användarna. Utan nyckeln kan AI inte kosta någonting. Sätter du den:
  lägg också ett utgiftstak i Anthropic-konsolen och håll ett öga på
  *Admin → AI-förbrukning* första veckan.
- **Villkor och integritetspolicy är publicerade** utan utkastmärkning, men är skrivna
  utan jurist. Låt någon titta på dem när det finns budget, särskilt ansvarsbegränsningen.

---

## Läget i skarp drift (6 augusti 2026)

| | Antal |
|---|---|
| Kandidater | 3 |
| Företag | 2 (båda markerade som pilotkunder) |
| Annonser | 0 |
| Meddelanden | 7 |
| Önskemål på önskelistan | 3 |
| AI-anrop hittills | 0 |

**Två av tre kandidater har helt tomma CV.** De registrerade sig, hamnade direkt på
Mitt CV, och fyllde inte i något. Om mönstret håller när fler kommer in är det den
viktigaste saken att åtgärda – ett tomt CV är osynligt i förhandsvisningen och nästan
värdelöst i sökningen. Tänkbara åtgärder: kortare formulär, eller ett påminnelsemail
efter några dagar (kräver att e-posten fungerar).

**Adamaswear AB har inget fakturasätt valt.** De är kund men systemet har ingen
fakturaadress till dem. De flyttades dessutom 6 augusti från 799 kr/mån till
årsabonnemang när månadsbetalningen togs bort – **det är en prishöjning de inte
godkänt, så hör av dig innan nästa faktura.**

---

## Vad som är byggt

Tre roller med varsitt gränssnitt.

**Kandidat** – Lediga jobb (hopfällbara annonser, filter på kommun, kategori och
företagsnamn) · Registrerade företag (favoriter, dölj min profil) · Topplista ·
Önska företag · Mitt CV (presentation, personligt brev, erfarenhet, utbildning,
kategorier, kommuner, löneanspråk, profilbild, AI-granskning) · Min sida (uppgifter,
vilka som läst CV:t, blockera e-postdomäner, ladda ner alla mina uppgifter) ·
Meddelanden.

**Företag** – CVArkivet (sök, filtrera på kommun/kategori/fritext, dölj tomma CV,
hjärta kandidater) · Annonser (skapa, se intresseanmälningar, filtrera på
matchningspoäng) · Topplista · Vår sida (uppgifter, logotyp, abonnemang, fakturaval) ·
Meddelanden. Utan abonnemang visas tre anonymiserade kandidater som smakprov.

**Admin** – Registrerade användare (läs CV, kommunfilter, gallring) · Registrerade
företag (godkänn, kommunfilter, faktureringsunderlag, CSV-export, pilotkund) ·
Topplista · Önskelistan · Mitt konto · AI-förbrukning (kostnad i kronor per dag, månad
och totalt, samt nödstopp).

### Prismodell

Ett enda abonnemang: **helår**. 4 990 kr för arbetsgivare, 9 990 kr för bemannings- och
rekryteringsföretag, exklusive moms. Månadsbetalning och karensregeln togs bort
6 augusti 2026.

**Pilotkunder** markeras av admin på företagets sida, med valfritt slutdatum och en
anteckning. De får full åtkomst utan att debiteras, hamnar aldrig i
faktureringsunderlaget och räknas inte in i årsvärdet – så intäktssiffran förblir sann.
Tomt slutdatum betyder tills vidare; ett passerat datum stänger åtkomsten.

### AI-kostnad

**Inget anrop mot Claude sker automatiskt.** Varje matchning och varje CV-granskning
kräver ett klick, svaren sparas och återanvänds tills CV:t eller annonsen ändrats, och
det finns dygnskvoter per konto plus ett tak för hela sajten. En matchning kostar cirka
3 öre, en granskning cirka 20 öre. Med hundra kandidater och tio företag landar
kostnaden runt femtio kronor i månaden. Admin kan när som helst dra i nödstoppet.

### Säkerhet

Lösenord kontrolleras mot kända dataintrång via Have I Been Pwned, med k-anonymitet –
lösenordet lämnar aldrig servern. Minst 10 tecken, får inte innehålla namn, e-postadress
eller företagsnamn. Lagring med bcrypt kostnad 12. Svarar tjänsten inte släpps lösenordet
igenom, så ett API som ligger nere kan inte hindra någon från att skapa konto.

---

## Beslut som är tagna – och varför

| Beslut | Motivering |
|---|---|
| **Födelsedatum i stället för personnummer** | Ett register med hundratals personnummer är en stor GDPR-risk som kräver stark rättslig grund, och gav ingen nytta. Företag ser bara åldern. |
| **Internt meddelandesystem** | Den ursprungliga beskrivningen saknade helt en väg för företaget att nå kandidaten efter att ha hjärtat hen. |
| **Manuell fakturering** | Ditt val. Admin visar underlaget, du fakturerar i ditt bokföringsprogram. Stripe Billing är nästa steg om det ska automatiseras. |
| **Priser exklusive moms** | Ditt val, standard för B2B. 4 990 kr blir 6 238 kr och 9 990 kr blir 12 488 kr inkl. moms. |
| **Endast årsabonnemang** | Ett pris, ett val, en faktura per kund och år. Karensregeln togs bort samtidigt – med bara ett abonnemang fanns inget kvar att utnyttja. |
| **Smakprov på 3 kandidater** | Ett företag som aldrig sett innehållet har svårt att bedöma om 4 990 kr är värt det. Smakprovet är anonymiserat, så uppgifterna ligger kvar bakom betalväggen. |
| **Pilotkunder** | Låter dig ge bort tjänsten till de första kunderna utan att förhandla pris innan du vet om den håller – och utan att intäktssiffran ljuger. |
| **AI bara på knapptryck** | Kostnaden ska aldrig kunna rulla i bakgrunden. Se avsnittet ovan. |
| **Lösenord mot HIBP** | Chrome varnar ändå användarna. Bättre att hindra dem från att välja ett läckt lösenord från början än att skylla ifrån sig. |
| **PostgreSQL (Neon) i drift, SQLite lokalt** | Postgres krävs på Vercel. SQLite-varianten gör att du kan utveckla utan databaskonto eller internet. |
| **Vercel + Neon framför egen server** | Enklare drift, automatisk deploy och SSL. Dyrare än en VPS men kräver ingen serverkunskap. |
| **Gallring efter 24 månader, varning efter 23** | Integritetspolicyn lovade det redan. Betalande företag och pilotkunder undantas så att en kund aldrig försvinner av misstag. |
| **Manuellt godkännande av företag** | Hindrar låtsasföretag från att bläddra bland riktiga personers CV. |
| **Företag måste ha egen e-postdomän** | Gör det svårare att skapa falska konton, och krävs för att kandidaternas domänblockering ska fungera. Kandidater får använda vilken adress de vill. |
| **Besöksadress frivillig, "Hela Sverige" som kommun** | Konsulter, webbshoppar och distansbolag har varken adress eller ort. Hela Sverige-företag följer med på alla kommunfilter eftersom de är lika relevanta överallt. |

---

## Buggar som hittats och rättats

Värt att känna till, eftersom flera av dem var osynliga tills någon tittade noga.

- **Kommunfiltret raderades tyst av fritextsökningen.** Båda byggde ett `OR` som
  syskonnycklar i samma `where`-objekt, så den sista skrev över den första. Ett företag
  som sökte "säljare" i Växjö fick i själva verket träffar från hela landet. Villkoren
  ligger nu i en `AND`-lista. **Regeln: filter som använder `OR` måste ligga i `AND`.**
- **Notiser i sidomenyn nollställdes inte.** Databasen uppdaterades korrekt, men
  räknarna beräknas i `layout.tsx` och Next.js återanvänder layouten vid
  klientnavigering. Sidor som markerar något som läst renderar nu `<UppdateraMeny />`.
- **"Skicka meddelande" ledde ingenstans** för en kandidat man aldrig skrivit till.
  Meddelandesidan byggde trådar enbart ur befintliga meddelanden.
- **Dolda kandidater gick att kontakta** med ett gissat id – `messageCandidate` saknade
  dölj-kontrollen som fanns i sökningen.
- **Adminadresser räknades inte som upptagna.** En kandidat kunde registrera sig på
  samma adress som ett adminkonto och bli tyst utelåst, eftersom inloggningen provar
  admin först. Det hade redan hänt med john@jaspen.se.
- **E-postmallen till godkända företag** hade kvar priser från den allra första
  prislistan (299/499 kr) genom två prisändringar.

---

## Kända problem

- **`npm run dev:sqlite` startar inte.** Dev-servern kraschar på `globals.css` med
  *"Unexpected character '@'"* – Tailwind-direktiven tolkas inte. `npm run build`
  fungerar utan problem, så det är enbart dev-läget. Rensning av `.next` hjälpte inte.
  Behöver felsökas; tills dess får ändringar verifieras med `npm run build` och i drift.
- **Ingen tvåfaktorsautentisering** för admin. Skyddet ligger i stället på Neon- och
  Vercel-kontot.
- **Ingen bildbeskärning** vid uppladdning av logotyp eller profilbild.
- **Ingen sökbevakning** – kandidater får inga mail om nya matchande annonser.

---

## Nästa steg, i ordning

1. **Fixa e-posten.** MX + Resend hos one.com. Allt annat väntar på den.
2. **Uppgradera till Vercel Pro** och slå på point-in-time restore i Neon.
3. **Skaffa de första företagen.** Tjänsten är värdelös för kandidater utan företag och
   tvärtom. Markera dem som pilotkunder – full åtkomst utan faktura.
4. **Ta tag i de tomma CV:na.** Två av tre kandidater har inte fyllt i något.
5. **Ring Adamaswear** om prisändringen och fakturasättet.
6. **Juristgranska** `/villkor` och `/integritetspolicy` när det finns budget.
7. **Följ upp efter en månad** i adminvyn: hur många CV finns, hur många företag
   betalar, hur många meddelanden skickas?

### Idéer för version 2

- Stripe Billing så att betalningen sköter sig själv
- Sökbevakning: mail till kandidater när en matchande annons publiceras
- Uppladdning av CV som PDF
- Tvåfaktorsautentisering för admin
- Statistik för företag: hur många såg annonsen, hur många anmälde intresse
- Kontroll av lösenord mot HIBP även vid inloggning, med mail till berörda

---

## Om du blir utelåst från admin

Adminkonton kan inte återställa lösenord via e-post. Det är medvetet – en mailbaserad
återställning på ett konto som ser alla CV i systemet vore en svag punkt. I stället:

1. **Hämta databasadressen.** [Neon](https://console.neon.tech) → projektet →
   *Connection string*. Alternativt Vercel → Settings → Environment Variables →
   `DATABASE_URL`. Din verkliga huvudnyckel är alltså inloggningen till Neon eller
   Vercel, inte adminlösenordet. **Sätt tvåfaktor på det kontot.**
2. **Kör återställningen** i projektmappen:

   ```bash
   npm run admin -- "--url=postgresql://..."
   ```

   Skriptet listar befintliga adminkonton, låter dig sätta ett nytt lösenord eller skapa
   ett nytt konto, visar vilken databasserver det är på väg att ändra i (utan lösenordet
   i klartext) och kräver att du skriver JA. Trycker du bara Enter vid lösenordsfrågan
   får du ett slumpat starkt lösenord.

3. **Sista utvägen:** Neon-konsolen har en SQL-editor där du kan radera raden i
   `Admin`-tabellen för hand och sedan skapa en ny med skriptet. Lösenordet är
   bcrypt-hashat och går inte att skriva in i klartext.

Skriptet vägrar köra om `DATABASE_URL` pekar på den lokala SQLite-filen, så du kan inte
råka nollställa fel databas.

---

## Kommandon

```bash
npm run admin          # sätt nytt adminlösenord eller skapa adminkonto
npm run build          # kontrollera att allt kompilerar (fungerar)
npm run dev:sqlite     # kör lokalt med testdata (TRASIG – se Kända problem)
npm run sqlite:setup   # bygg om den lokala testdatabasen från grunden
npm run db:studio      # grafiskt gränssnitt mot databasen
```

**Kör mot skarp databas** (migrationer, engångsskript) genom att sätta adressen
uttryckligen, eftersom `.env` pekar på SQLite:

```powershell
$u="postgresql://..."; $env:DATABASE_URL=$u; $env:DATABASE_URL_UNPOOLED=$u
npx prisma migrate deploy
```

Kör alltid `npx prisma generate` efteråt om du växlat mellan SQLite och Postgres –
klienten genereras för en av dem åt gången, och fel variant ger felmeddelandet
*"URL must start with the protocol file:"* eller tvärtom.

**Testinloggningar lokalt**, lösenord `losenord123`:
admin@cvarkivet.se · rekrytering@nordisklogistik.se · jobb@byggpartnervast.se
(båda med årsabonnemang) · hr@ab.se (inget abonnemang, visar förhandsvisningen) ·
johan@example.se, sara@example.se, ali@example.se, emma@example.se

---

## Var saker ligger

Se strukturöversikten i [README.md](./README.md), som också innehåller alla
affärsregler. Det viktigaste att känna till:

- **Affärsreglerna** sitter i `src/lib/` och `src/app/actions/` – inte i sidorna.
- **Migrationer skrivs för hand.** `prisma migrate dev` vill återställa hela databasen
  eftersom äldre migrationsfiler redigerats i efterhand. Använd i stället:
  `npx prisma migrate diff --from-url $u --to-schema-datamodel prisma/schema.prisma --script`
  och spara resultatet som `prisma/migrations/<datum>_<namn>/migration.sql`, sedan
  `npx prisma migrate deploy`. **Skriv aldrig migrationsfiler med PowerShells
  `Out-File -Encoding utf8`** – den lägger till en BOM som Postgres avvisar.
- **`vercel.json` tål inga egna nycklar.** En kommentar som `"//"` gör hela filen
  ogiltig och deployen misslyckas tyst.
- **`.env` innehåller hemligheter** och ska aldrig checkas in eller delas.
