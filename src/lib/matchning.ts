import 'server-only';
import { prisma } from './db';
import { aiArPakopplad, beraknaMatchning, byggKandidatunderlag } from './ai';

/**
 * Hämtar en matchningspoäng, och räknar ut den om den saknas eller blivit
 * inaktuell. Sparade poäng återanvänds tills CV:t eller annonsen ändrats.
 */

const kandidatUrval = {
  headline: true,
  seeking: true,
  summary: true,
  coverLetter: true,
  skills: true,
  languages: true,
  drivingLicense: true,
  cvUpdatedAt: true,
  categories: { select: { category: true } },
  experiences: {
    select: { title: true, employer: true, fromDate: true, toDate: true, description: true },
  },
  educations: { select: { program: true, school: true, fromDate: true, toDate: true } },
} as const;

export type Matchning = { score: number; motivation: string };

export async function hamtaEllerBeraknaMatchning(
  userId: string,
  jobAdId: string
): Promise<Matchning | null> {
  if (!aiArPakopplad()) return null;

  const [befintlig, user, annons] = await Promise.all([
    prisma.matchScore.findUnique({ where: { userId_jobAdId: { userId, jobAdId } } }),
    prisma.user.findUnique({ where: { id: userId }, select: kandidatUrval }),
    prisma.jobAd.findUnique({
      where: { id: jobAdId },
      select: { title: true, body: true, category: true, updatedAt: true },
    }),
  ]);

  if (!user || !annons) return null;

  const aktuell =
    befintlig &&
    befintlig.adVersion.getTime() === annons.updatedAt.getTime() &&
    (befintlig.cvVersion?.getTime() ?? 0) === (user.cvUpdatedAt?.getTime() ?? 0);

  if (aktuell && befintlig) {
    return { score: befintlig.score, motivation: befintlig.motivation };
  }

  const resultat = await beraknaMatchning(byggKandidatunderlag(user), {
    rubrik: annons.title,
    text: annons.body,
    kategori: annons.category,
  });

  if (!resultat.ok) return null;

  await prisma.matchScore.upsert({
    where: { userId_jobAdId: { userId, jobAdId } },
    create: {
      userId,
      jobAdId,
      score: resultat.data.score,
      motivation: resultat.data.motivation,
      cvVersion: user.cvUpdatedAt,
      adVersion: annons.updatedAt,
    },
    update: {
      score: resultat.data.score,
      motivation: resultat.data.motivation,
      cvVersion: user.cvUpdatedAt,
      adVersion: annons.updatedAt,
      createdAt: new Date(),
    },
  });

  return resultat.data;
}

/**
 * Räknar ut matchning för flera kandidater mot samma annons.
 *
 * Körs i små omgångar för att inte skicka iväg hundra samtidiga anrop, och
 * har ett tak per körning så att en annons med tusen kandidater inte blir
 * oväntat dyr. Resten räknas ut nästa gång sidan öppnas.
 */
const TAK_PER_KORNING = 25;
const OMGANGSSTORLEK = 5;

export async function beraknaForAnnons(jobAdId: string, userIds: string[]) {
  if (!aiArPakopplad()) return;

  const annons = await prisma.jobAd.findUnique({
    where: { id: jobAdId },
    select: { updatedAt: true },
  });
  if (!annons) return;

  const sparade = await prisma.matchScore.findMany({
    where: { jobAdId, userId: { in: userIds } },
    select: { userId: true, adVersion: true, cvVersion: true },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, cvUpdatedAt: true },
  });
  const cvVersioner = new Map(users.map((u) => [u.id, u.cvUpdatedAt?.getTime() ?? 0]));

  const aktuella = new Set(
    sparade
      .filter(
        (s) =>
          s.adVersion.getTime() === annons.updatedAt.getTime() &&
          (s.cvVersion?.getTime() ?? 0) === (cvVersioner.get(s.userId) ?? 0)
      )
      .map((s) => s.userId)
  );

  const saknas = userIds.filter((id) => !aktuella.has(id)).slice(0, TAK_PER_KORNING);

  for (let i = 0; i < saknas.length; i += OMGANGSSTORLEK) {
    const omgang = saknas.slice(i, i + OMGANGSSTORLEK);
    await Promise.all(omgang.map((userId) => hamtaEllerBeraknaMatchning(userId, jobAdId)));
  }
}
