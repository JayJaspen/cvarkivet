import 'server-only';
import { prisma } from './db';
import { aiArPakopplad, kostnadKronor, type Forbrukning } from './ai';

/**
 * Kostnadsspärrar för AI-funktionerna.
 *
 * Varje anrop mot Claude kostar pengar, och inget anrop sker av sig självt –
 * en kandidat eller ett företag måste alltid trycka på en knapp. Den här
 * modulen skyddar mot det som ändå kan gå fel: att någon trycker väldigt
 * många gånger.
 *
 * Tre lager:
 *
 * 1. Nödstopp – admin kan stänga av AI direkt i gränssnittet, utan att någon
 *    kod behöver läggas upp på nytt.
 * 2. Dygnskvot per konto – ingen enskild kandidat eller företag kan dra iväg.
 * 3. Dygnskvot för hela sajten – ett tak på vad en dag maximalt kan kosta,
 *    även om tusen konton skulle användas samtidigt.
 */

export const KVOTER = {
  /** Matchningar en kandidat får räkna ut per dygn. Cirka 3 öre styck. */
  MATCHNING_PER_KANDIDAT: 25,
  /** CV-granskningar en kandidat får begära per dygn. Cirka 20 öre styck. */
  GRANSKNING_PER_KANDIDAT: 3,
  /** Matchningar ett företag får räkna ut per dygn, över alla sina annonser. */
  MATCHNING_PER_FORETAG: 200,
  /** Tak för hela sajten per dygn. Vid Haiku-pris motsvarar det ungefär 60 kr. */
  ANROP_TOTALT: 2000,
} as const;

const NODSTOPP = 'ai_nodstopp';

function dygnetsStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Är AI avstängt av admin? Nödstoppet gäller före allt annat. */
export async function aiArAvstangt(): Promise<boolean> {
  const rad = await prisma.installning.findUnique({ where: { nyckel: NODSTOPP } });
  return rad?.varde === 'pa';
}

export async function satNodstopp(pa: boolean, andradAv: string) {
  await prisma.installning.upsert({
    where: { nyckel: NODSTOPP },
    create: { nyckel: NODSTOPP, varde: pa ? 'pa' : 'av', andradAv },
    update: { varde: pa ? 'pa' : 'av', andradAv },
  });
}

export type KvotSvar = { ok: true; kvarIDag: number } | { ok: false; error: string };

/**
 * Kollar om ett anrop får göras. Anropas alltid innan något skickas till
 * Claude, aldrig efteråt.
 *
 * `antal` är hur många anrop som är på väg – ett företag som räknar ut
 * matchning för 25 kandidater bokar 25 mot kvoten, inte ett.
 */
export async function kontrolleraKvot(
  vem: { userId?: string; companyId?: string },
  typ: 'MATCHNING' | 'GRANSKNING',
  antal = 1
): Promise<KvotSvar> {
  if (!aiArPakopplad()) return { ok: false, error: 'AI-funktionerna är inte påslagna.' };

  if (await aiArAvstangt())
    return {
      ok: false,
      error: 'AI-funktionerna är tillfälligt avstängda. Försök igen senare.',
    };

  const fran = dygnetsStart();

  const [egna, totalt] = await Promise.all([
    prisma.aiAnrop.count({
      where: {
        typ,
        createdAt: { gte: fran },
        ...(vem.userId ? { userId: vem.userId } : { companyId: vem.companyId }),
      },
    }),
    prisma.aiAnrop.count({ where: { createdAt: { gte: fran } } }),
  ]);

  if (totalt + antal > KVOTER.ANROP_TOTALT)
    return {
      ok: false,
      error: 'AI-funktionerna har nått dagens tak för hela sajten. Försök igen i morgon.',
    };

  const tak = vem.companyId
    ? KVOTER.MATCHNING_PER_FORETAG
    : typ === 'GRANSKNING'
      ? KVOTER.GRANSKNING_PER_KANDIDAT
      : KVOTER.MATCHNING_PER_KANDIDAT;

  const kvar = tak - egna;

  if (kvar <= 0)
    return {
      ok: false,
      error:
        typ === 'GRANSKNING'
          ? `Du har använt dina ${tak} granskningar för i dag. Du kan granska igen i morgon.`
          : `Du har räknat ut ${tak} matchningar i dag, vilket är dagens tak. Fler går att räkna ut i morgon.`,
    };

  return { ok: true, kvarIDag: kvar };
}

/**
 * Sparar vad ett anrop faktiskt kostade. Körs även när anropet misslyckades,
 * eftersom ett misslyckat anrop också kan ha förbrukat tokens.
 */
export async function loggaAnrop(
  vem: { userId?: string; companyId?: string },
  typ: 'MATCHNING' | 'GRANSKNING',
  forbrukning: Forbrukning | undefined,
  lyckades: boolean
) {
  if (!forbrukning) return;
  try {
    await prisma.aiAnrop.create({
      data: {
        typ,
        modell: forbrukning.modell,
        inTokens: forbrukning.inTokens,
        utTokens: forbrukning.utTokens,
        userId: vem.userId ?? null,
        companyId: vem.companyId ?? null,
        lyckades,
      },
    });
  } catch (err) {
    // Loggningen får aldrig fälla själva funktionen för användaren.
    console.error('Kunde inte spara AI-anrop:', err);
  }
}

/** Summering för adminvyn. */
export async function forbrukning(fran: Date) {
  const anrop = await prisma.aiAnrop.findMany({
    where: { createdAt: { gte: fran } },
    select: { typ: true, modell: true, inTokens: true, utTokens: true, createdAt: true },
  });

  let kronor = 0;
  let matchningar = 0;
  let granskningar = 0;

  for (const a of anrop) {
    kronor += kostnadKronor(a.modell, a.inTokens, a.utTokens, a.createdAt);
    if (a.typ === 'MATCHNING') matchningar++;
    else granskningar++;
  }

  return { antal: anrop.length, matchningar, granskningar, kronor };
}
