# Driftsättning av CVArkivet.se

Steg-för-steg från färdig kod till live sajt. Räkna med 60–90 minuter första gången.
Allt i koden är redan förberett – det som återstår är konton och miljövariabler.

**Löpande kostnad:** Vercel Pro ca 20 USD/mån (krävs, tjänsten är kommersiell), Neon
och Resend har gratisnivåer som räcker länge. Domänen har du redan hos one.com.

---

## 1. Lägg koden på GitHub

Vercel bygger från ett Git-repo.

```bash
cd C:\Users\info\Desktop\CVArkivet
git init
git add .
git commit -m "CVArkivet"
```

Skapa ett **privat** repo på github.com och följ instruktionerna för att pusha.

`.gitignore` är redan satt så att `.env`, `node_modules` och databasfiler inte följer med.
**Kontrollera att `.env` inte ligger med i commiten** – den innehåller din hemliga nyckel.

---

## 2. Databas hos Neon

1. Skapa konto på **neon.tech**.
2. Nytt projekt, namn `cvarkivet`. Välj region **EU (Frankfurt)** – viktigt för GDPR.
3. Kopiera anslutningssträngen under *Connection string* → välj **Pooled connection**.
   Den ser ut ungefär så här:
   `postgresql://user:lösen@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`
4. Spara den, du behöver den i steg 5.

Migrationen ligger redan färdig i `prisma/migrations/0_init/`. Skapa tabellerna
genom att köra från din dator:

```powershell
$env:DATABASE_URL="din-neon-url-här"
npx prisma migrate deploy
```

Du ska få `1 migration found` följt av `Applied migration`.

### Skapa ditt adminkonto

Testdatan ska **inte** in i produktion. Kör i stället:

```powershell
$env:DATABASE_URL="din-neon-url-här"
node -e "const{PrismaClient}=require('@prisma/client');const b=require('bcryptjs');const p=new PrismaClient();p.admin.create({data:{email:'DIN@EPOST.se',name:'Ditt Namn',passwordHash:b.hashSync('DITT-LÖSENORD',10)}}).then(()=>{console.log('Admin skapad');process.exit(0)})"
```

Byt ut e-post och lösenord. Använd ett långt, unikt lösenord.

---

## 3. E-post hos Resend

1. Skapa konto på **resend.com**.
2. *Domains* → **Add domain** → skriv `cvarkivet.se`.
3. Resend visar tre poster (SPF, DKIM och ofta DMARC). Lägg in dem hos one.com enligt steg 6.
4. När domänen är verifierad: *API Keys* → **Create API Key** med rättigheten *Sending access*.
   Kopiera nyckeln, den visas bara en gång.

---

## 4. Fillagring för logotyper

I Vercel-projektet: fliken **Storage** → **Create** → **Blob** → namn `cvarkivet-logotyper`.
Vercel lägger automatiskt in `BLOB_READ_WRITE_TOKEN` som miljövariabel.

---

## 5. Deploy till Vercel

1. Skapa konto på **vercel.com** och koppla ditt GitHub-konto.
2. **Add New → Project** → välj repot. Vercel känner igen Next.js automatiskt.
3. Uppgradera till **Pro** – Hobby-planen får inte användas kommersiellt.
4. Lägg in miljövariabler under *Settings → Environment Variables*:

| Namn | Värde |
|---|---|
| `DATABASE_URL` | Neon-strängen från steg 2 |
| `AUTH_SECRET` | **Generera en ny**, se nedan |
| `NEXT_PUBLIC_APP_URL` | `https://cvarkivet.se` |
| `RESEND_API_KEY` | Nyckeln från steg 3 |
| `EMAIL_FROM` | `CVArkivet <no-reply@cvarkivet.se>` |
| `CRON_SECRET` | **Generera en till**, skyddar det nattliga gallringsjobbet |
| `BLOB_READ_WRITE_TOKEN` | Sätts automatiskt i steg 4 |

Generera en produktionsnyckel – **återanvänd inte den i din lokala `.env`**:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

5. Klicka **Deploy**.

Efter första deployen: kontrollera under *Settings → Cron Jobs* att jobbet
`/api/cron/gallring` finns och är schemalagt kl. 03:00. Det raderar inaktiva konton
enligt integritetspolicyn och läses in automatiskt från `vercel.json`.

---

## 6. Peka domänen från one.com

I Vercel: *Settings → Domains* → lägg till `cvarkivet.se` och `www.cvarkivet.se`.
Vercel visar då exakt vilka DNS-värden just ditt projekt ska ha – **använd dem**, inte
värdena nedan, om de skiljer sig.

Logga in på one.com → *Domän* → *DNS-inställningar* för cvarkivet.se:

| Typ | Namn | Värde |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Lägg samtidigt in Resend-posterna från steg 3:

| Typ | Namn | Värde |
|---|---|---|
| TXT | `send` (eller enligt Resend) | SPF-värdet från Resend |
| TXT | `resend._domainkey` | DKIM-värdet från Resend |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |

Ta bort eventuella gamla A- eller CNAME-poster för `@` och `www` som pekar på one.coms
egna servrar, annars krockar de.

DNS tar mellan 10 minuter och några timmar att slå igenom. Vercel utfärdar SSL-certifikat
automatiskt när domänen pekar rätt.

---

## 7. Innan du släpper på riktiga användare

- [ ] Logga in som admin och kontrollera att båda flikarna fungerar.
- [ ] Registrera ett testkonto som kandidat och ett som företag, aktivera prenumeration,
      öppna ett CV och kontrollera att notismailet kommer fram.
- [ ] Testa **Glömt lösenord** och att mailet landar i inkorgen, inte skräpposten.
- [ ] Ladda upp en logotyp och kontrollera att den syns efter en ny deploy.
- [ ] Låt jurist granska `/villkor` och `/integritetspolicy`.
- [ ] Teckna personuppgiftsbiträdesavtal med Vercel, Neon och Resend
      (finns som självbetjäning hos alla tre).
- [ ] Slå på **Point-in-time restore** i Neon.
- [ ] Logga in som admin → *Registrerade användare* → klicka **Testkör** på gallringen
      och kontrollera att den svarar utan fel.
- [ ] Radera testdatan om du kört seed mot produktionsdatabasen.

---

## Löpande drift

**Fakturering:** logga in som admin → *Registrerade företag* → filtrera på prenumeration.
Där ser du organisationsnummer, fakturaadress och kontaktperson för varje kund.
Alla priser är exklusive moms.

**Ny version av sajten:** pusha till GitHub, Vercel bygger och driftsätter automatiskt.

**Ändrad datamodell:** kör `npx prisma migrate dev --name beskrivning` lokalt, committa
migrationsfilen, och lägg till `prisma migrate deploy` i Vercels build-kommando.

**Databasens innehåll:** `npx prisma studio` mot produktionsdatabasen ger ett grafiskt
gränssnitt. Var försiktig – ändringar slår igenom direkt.
