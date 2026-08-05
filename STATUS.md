# Status och nästa steg

Senast uppdaterad: **5 augusti 2026**

> **Sajten är live på https://cvarkivet.vercel.app** (testmiljö).
> Domänen cvarkivet.se är ännu inte påkopplad. Se DRIFTSATTNING.md steg 6.

Den här filen är till för att snabbt komma tillbaka in i projektet efter en paus –
eller för att ge en ny person (eller AI-assistent) hela bilden på fem minuter.

---

## Var vi står

Koden är **färdig och testad**. Sajten bygger utan fel och alla flöden har klickats
igenom lokalt. Det som återstår innan lansering är **inte kod** – det är konton hos
Neon, Resend och Vercel samt DNS-poster hos one.com.

Följ [DRIFTSATTNING.md](./DRIFTSATTNING.md) när du är redo. Räkna med 60–90 minuter.

**Kostnad i drift:** Vercel Pro ca 20 USD/mån (obligatoriskt, tjänsten är kommersiell).
Neon och Resend ligger inom gratisnivåerna till att börja med. Domänen finns hos one.com.

---

## Vad som är byggt

Tre roller med varsitt gränssnitt, all funktionalitet från den ursprungliga
kravbeskrivningen plus några tillägg.

**Kandidat** – Lediga jobb (filter på kommun, kategori och företagsnamn) ·
Registrerade företag (favoritmarkering och dölj-funktion) · Mitt CV (presentation,
personligt brev, erfarenhet, utbildning, kategorier, kommuner, löneanspråk) ·
Min sida (uppgifter, statistik över vilka som läst CV:t, blockera e-postdomäner) ·
Meddelanden.

**Företag** – CVArkivet (sök, filtrera, hjärta kandidater) · Annonser (skapa, se
utgångna, radera) · Vår sida (uppgifter, presentation, logotyp, prenumeration) ·
Meddelanden.

**Admin** – Registrerade användare (läs CV, se besökta företag, stäng av konton) ·
Registrerade företag (faktureringsunderlag per prenumeration, lästa CV, stäng av).

---

## Beslut som är tagna – och varför

| Beslut | Motivering |
|---|---|
| **Födelsedatum i stället för personnummer** | Ett register med hundratals personnummer är en stor GDPR-risk som kräver stark rättslig grund, och gav ingen nytta. Företag ser bara åldern. |
| **Internt meddelandesystem** | Den ursprungliga beskrivningen saknade helt en väg för företaget att nå kandidaten efter att ha hjärtat hen. |
| **Manuell fakturering** | Ditt val. Admin visar underlaget, du fakturerar i ditt bokföringsprogram. Stripe Billing är nästa steg om det ska automatiseras. |
| **Priser exklusive moms** | Ditt val, standard för B2B. 299 kr blir 374 kr och 499 kr blir 624 kr inkl. moms. |
| **2 månaders karens efter uppsägning** | Ska hindra företag från att hoppa in och ut ur prenumerationer. Gäller även nyregistrering på samma e-postdomän. Admin kan häva den. |
| **PostgreSQL (Neon) i drift, SQLite lokalt** | Postgres krävs på Vercel. SQLite-varianten gör att du kan utveckla utan databaskonto eller internet. |
| **Vercel + Neon framför egen server** | Enklare drift, automatisk deploy och SSL. Dyrare än en VPS men kräver ingen serverkunskap. |
| **Gallring efter 24 månader, varning efter 23** | Integritetspolicyn lovade det redan. Betalande företag undantas så att en kund aldrig försvinner av misstag. |
| **Manuellt godkännande av företag** | Hindrar låtsasföretag från att bläddra bland riktiga personers CV. Företaget kan logga in och förbereda sig under tiden, vilket ger dig bättre underlag att bedöma dem på. |
| **Företag måste ha egen e-postdomän** | Gör det svårare att skapa falska konton, och krävs för att kandidaternas domänblockering ska fungera. Kandidater får fortfarande använda vilken adress de vill. |

---

## Öppna frågor

Inget av detta blockerar lansering, men bör beslutas:

1. **Karensen på 2 månader kan uppfattas som inlåsning.** Överväg om den ska framgå
   tydligare i villkoren, eller ersättas med uppsägningstid.
2. **Lösenordsåterställning byggdes trots att du inte valde den** i frågan om vilka mail
   systemet ska skicka. Utan den blir du personlig supportfunktion. Vill du ändå bort
   med den: radera `src/app/glomt-losenord/` och `src/app/aterstall-losenord/`.
3. **Notismailet om lästa CV** skickas max en gång per dygn och företag. Blir det ändå
   för mycket när många företag är aktiva, gör om det till en veckosammanfattning.
4. ~~Gallring av inaktiva konton~~ – **löst 4 augusti.** Ett cron-jobb kör varje natt
   kl. 03:00, varnar via mail 30 dagar innan och raderar efter 24 månader. Admin kan
   testköra från *Registrerade användare*. Kräver `CRON_SECRET` i Vercel.

---

## Nästa steg, i ordning

1. **Lansera** enligt DRIFTSATTNING.md – konton, DNS, adminkonto, checklista.
2. **Juristgranska** `/villkor` och `/integritetspolicy`. De är utkast.
3. **Skaffa de första företagen.** Tjänsten är värdelös för kandidater utan företag,
   och tvärtom. Fundera på om de första kunderna ska få rabatt eller fri period.
4. **Följ upp efter en månad:** hur många CV finns, hur många företag betalar, hur
   många meddelanden skickas? Adminvyn visar det mesta.

### Idéer för version 2

- Stripe Billing så att betalningen sköter sig själv
- Sökbevakning: mail till kandidater när en matchande annons publiceras
- Uppladdning av CV som PDF
- Tvåfaktorsautentisering för admin
- Statistik för företag: hur många såg annonsen, hur många sökte

---

## Kommandon

```bash
npm run dev:sqlite     # kör lokalt med testdata
npm run sqlite:setup   # bygg om den lokala testdatabasen från grunden
npm run build          # kontrollera att allt kompilerar
npm run db:studio      # grafiskt gränssnitt mot databasen
```

**Testinloggningar lokalt**, lösenord `losenord123`:
admin@cvarkivet.se · rekrytering@nordisklogistik.se (fullt paket) ·
jobb@byggpartnervast.se (bara CV) · hr@ab.se (ingen prenumeration) ·
johan@example.se, sara@example.se, ali@example.se, emma@example.se

Utan `RESEND_API_KEY` skickas inga mail – de skrivs ut i terminalen. Praktiskt när du
vill testa lösenordsåterställning: kopiera länken därifrån.

---

## Var saker ligger

Se strukturöversikten i [README.md](./README.md). Det viktigaste att känna till:

- **Affärsreglerna** (paywall, karens, dolda profiler) sitter i `src/lib/` och
  `src/app/actions/` – inte i sidorna.
- **Alla ändringar av databasen** kräver en ny migration:
  `npx prisma migrate dev --name vad-du-andrade`
- **`.env` innehåller hemligheter** och ska aldrig checkas in eller delas.
