/**
 * Återställning av adminkonton.
 *
 * Adminkonton kan inte återställa lösenord via e-post – det är medvetet, en
 * mailbaserad återställning på ett konto som ser alla CV i systemet vore en
 * svag punkt. I stället finns det här skriptet, som kräver åtkomst till
 * databasen. Har du den åtkomsten har du redan kontroll över systemet.
 *
 * Körs med:
 *   npm run admin
 *
 * Databasen väljs i den här ordningen:
 *   1. --url=postgresql://...   (flaggan vinner alltid)
 *   2. DATABASE_URL i miljön
 *   3. DATABASE_URL i .env
 *
 * Skriptet skriver alltid ut vilken databasserver det är på väg att ändra i,
 * och frågar innan något sparas. Det ska inte gå att råka nollställa
 * produktionen när man trodde man satt i testmiljön.
 */

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { randomBytes } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const rl = createInterface({ input: stdin, output: stdout });
const fraga = (text) => rl.question(text);

/** Läser DATABASE_URL ur .env utan att dra in någon extra beroende. */
function franEnvFil() {
  if (!existsSync('.env')) return null;
  const rad = readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .find((r) => r.startsWith('DATABASE_URL='));
  if (!rad) return null;
  return rad.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
}

function hittaUrl() {
  const flagga = process.argv.find((a) => a.startsWith('--url='));
  if (flagga) return flagga.slice('--url='.length);
  return process.env.DATABASE_URL || franEnvFil();
}

/** Visar servern utan att skriva ut lösenordet i klartext. */
function beskrivUrl(url) {
  try {
    const u = new URL(url);
    return `${u.protocol.replace(':', '')}://${u.username}@${u.hostname}${u.pathname}`;
  } catch {
    return url.slice(0, 40);
  }
}

/** Lösenord som är starkt utan att vara omöjligt att läsa upp i telefon. */
function slumpaLosenord() {
  const tecken = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const byte = randomBytes(20);
  return Array.from(byte, (b) => tecken[b % tecken.length]).join('');
}

async function main() {
  const url = hittaUrl();

  if (!url) {
    console.error('\nHittade ingen DATABASE_URL.\n');
    console.error('Hämta den från Vercel (Settings → Environment Variables) eller');
    console.error('Neon (Dashboard → Connection string) och kör:\n');
    console.error('  npm run admin -- --url="postgresql://..."\n');
    process.exit(1);
  }

  if (url.startsWith('file:')) {
    console.error('\nDATABASE_URL pekar på den lokala SQLite-databasen, inte driften.');
    console.error('Vill du ändra i produktionen, ange adressen uttryckligen:\n');
    console.error('  npm run admin -- --url="postgresql://..."\n');
    process.exit(1);
  }

  console.log('\n  CVArkivet – adminkonton');
  console.log('  ────────────────────────────────────────────────');
  console.log(`  Databas: ${beskrivUrl(url)}\n`);

  const prisma = new PrismaClient({ datasources: { db: { url } } });

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (admins.length === 0) {
    console.log('  Det finns inga adminkonton alls.\n');
  } else {
    console.log(`  ${admins.length} adminkonto${admins.length === 1 ? '' : 'n'}:\n`);
    admins.forEach((a, i) => {
      console.log(
        `    ${i + 1}. ${a.email}  (${a.name}, skapat ${a.createdAt.toLocaleDateString('sv-SE')})`
      );
    });
    console.log('');
  }

  console.log('  Vad vill du göra?');
  console.log('    1. Sätt nytt lösenord på ett befintligt konto');
  console.log('    2. Skapa ett nytt adminkonto');
  console.log('    3. Avbryt\n');

  const val = (await fraga('  Val (1/2/3): ')).trim();

  if (val === '3' || val === '') {
    console.log('\n  Avbrutet. Ingenting ändrades.\n');
    await prisma.$disconnect();
    rl.close();
    return;
  }

  let epost;
  let namn;

  if (val === '1') {
    if (admins.length === 0) {
      console.log('\n  Det finns inga konton att ändra. Välj 2 för att skapa ett.\n');
      await prisma.$disconnect();
      rl.close();
      return;
    }
    const nr = (await fraga('  Vilket konto (nummer eller e-post): ')).trim();
    const valt =
      admins[Number(nr) - 1] ?? admins.find((a) => a.email === nr.toLowerCase());
    if (!valt) {
      console.error('\n  Hittade inget sådant konto.\n');
      await prisma.$disconnect();
      rl.close();
      process.exit(1);
    }
    epost = valt.email;
  } else if (val === '2') {
    epost = (await fraga('  E-postadress: ')).trim().toLowerCase();
    if (!epost.includes('@')) {
      console.error('\n  Det där ser inte ut som en e-postadress.\n');
      await prisma.$disconnect();
      rl.close();
      process.exit(1);
    }
    if (admins.some((a) => a.email === epost)) {
      console.error('\n  Adressen är redan ett adminkonto. Välj 1 för att byta lösenord.\n');
      await prisma.$disconnect();
      rl.close();
      process.exit(1);
    }
    // En adress kan inte vara både admin och kandidat/företag – inloggningen
    // kollar admin först, så det andra kontot skulle bli oåtkomligt.
    const krock =
      (await prisma.user.findUnique({ where: { email: epost }, select: { id: true } })) ||
      (await prisma.company.findUnique({ where: { email: epost }, select: { id: true } }));
    if (krock) {
      console.error('\n  Adressen används redan av ett kandidat- eller företagskonto.');
      console.error('  Inloggningen kollar admin först, så det kontot skulle bli oåtkomligt.');
      console.error('  Välj en annan adress.\n');
      await prisma.$disconnect();
      rl.close();
      process.exit(1);
    }
    namn = (await fraga('  Namn: ')).trim() || 'Administratör';
  } else {
    console.log('\n  Okänt val. Avbrutet.\n');
    await prisma.$disconnect();
    rl.close();
    return;
  }

  const eget = (
    await fraga('\n  Eget lösenord (minst 12 tecken), eller Enter för ett slumpat: ')
  ).trim();

  if (eget && eget.length < 12) {
    console.error('\n  Lösenordet måste vara minst 12 tecken.\n');
    await prisma.$disconnect();
    rl.close();
    process.exit(1);
  }

  const losenord = eget || slumpaLosenord();

  const atgard =
    val === '1' ? `Sätt nytt lösenord på ${epost}` : `Skapa adminkontot ${epost}`;
  console.log(`\n  ${atgard}`);
  console.log(`  i databasen ${beskrivUrl(url)}`);

  const ja = (await fraga('\n  Skriv JA för att genomföra: ')).trim();
  if (ja !== 'JA') {
    console.log('\n  Avbrutet. Ingenting ändrades.\n');
    await prisma.$disconnect();
    rl.close();
    return;
  }

  const passwordHash = await bcrypt.hash(losenord, 12);

  if (val === '1') {
    await prisma.admin.update({ where: { email: epost }, data: { passwordHash } });
  } else {
    await prisma.admin.create({ data: { email: epost, name: namn, passwordHash } });
  }

  console.log('\n  ────────────────────────────────────────────────');
  console.log('  Klart.\n');
  console.log(`    E-post:    ${epost}`);
  console.log(`    Lösenord:  ${losenord}\n`);
  console.log('  Logga in på https://cvarkivet.se/logga-in');
  console.log('  Spara lösenordet i din lösenordshanterare nu – det visas bara här.');
  console.log('  Rensa terminalen efteråt om någon annan kan se skärmen.\n');

  await prisma.$disconnect();
  rl.close();
}

main().catch(async (err) => {
  const text = String(err?.message ?? err);

  // Skilj på "du körde skriptet fel" och "databasen svarar inte". Att skicka
  // någon på jakt efter en ny databasnyckel när felet var stängd stdin är
  // precis vad man inte behöver mitt i en utelåsning.
  if (text.includes('readline was closed') || text.includes('ERR_USE_AFTER_CLOSE')) {
    console.error('\n  Skriptet behöver en interaktiv terminal.');
    console.error('  Kör det direkt i PowerShell eller Terminal, utan att skicka in svar.\n');
  } else if (text.includes("Can't reach database") || text.includes('ENOTFOUND')) {
    console.error('\n  Kunde inte nå databasen.');
    console.error('  Kontrollera adressen, eller hämta en färsk från Neon:');
    console.error('  Dashboard → Connection string → Pooled connection.\n');
  } else {
    console.error('\n  Något gick fel:', text.split('\n')[0]);
    console.error('\n  Går det inte att lösa: databasen når du alltid via Neon-konsolen,');
    console.error('  där du kan ändra Admin-tabellen för hand.\n');
  }

  rl.close();
  process.exit(1);
});
