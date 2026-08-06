'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireCompany, requireUser } from '@/lib/session';
import { aiArPakopplad, byggKandidatunderlag, granskaCv } from '@/lib/ai';
import { kontrolleraKvot, loggaAnrop } from '@/lib/ai-kvot';
import { beraknaForAnnons, hamtaEllerBeraknaMatchning } from '@/lib/matchning';
import { arGodkant, harCvAtkomst } from '@/lib/data';

/**
 * Samtliga AI-anrop utgår härifrån, och varje funktion kräver att någon
 * tryckt på en knapp. Ingenting körs på schema, vid inloggning eller när en
 * sida öppnas. Kvoten kontrolleras alltid innan något skickas till Claude.
 */

export type AiSvar = { error?: string; ok?: string } | undefined;

/** Kandidaten begär matchningspoäng för en annons. */
export async function raknaUtMatchning(_prev: AiSvar, form: FormData): Promise<AiSvar> {
  const user = await requireUser();
  const jobAdId = String(form.get('jobAdId'));

  const kvot = await kontrolleraKvot({ userId: user.id }, 'MATCHNING');
  if (!kvot.ok) return { error: kvot.error };

  const resultat = await hamtaEllerBeraknaMatchning(user.id, jobAdId, { userId: user.id });
  if (!resultat) return { error: 'Matchningen gick inte att räkna ut just nu. Försök igen.' };

  revalidatePath('/kandidat/jobb');
  return { ok: `Matchning uträknad. Du har ${kvot.kvarIDag - 1} kvar i dag.` };
}

/** Företaget begär matchning för kandidaterna som anmält intresse. */
export async function raknaUtMatchningForAnnons(
  _prev: AiSvar,
  form: FormData
): Promise<AiSvar> {
  const company = await requireCompany();
  if (!arGodkant(company) || !harCvAtkomst(company))
    return { error: 'Funktionen kräver ett godkänt konto med aktiv prenumeration.' };

  const jobAdId = String(form.get('jobAdId'));
  const annons = await prisma.jobAd.findUnique({
    where: { id: jobAdId },
    select: { companyId: true, interests: { select: { userId: true } } },
  });
  if (!annons || annons.companyId !== company.id) return { error: 'Annonsen hittades inte.' };

  const kvot = await kontrolleraKvot({ companyId: company.id }, 'MATCHNING');
  if (!kvot.ok) return { error: kvot.error };

  const antal = await beraknaForAnnons(
    jobAdId,
    annons.interests.map((i) => i.userId),
    { companyId: company.id },
    kvot.kvarIDag
  );

  revalidatePath(`/foretag/annonser/${jobAdId}`);
  return { ok: `Matchning uträknad för ${antal ?? 0} kandidater.` };
}

/** Kandidaten ber om en AI-granskning av sitt CV. */
export async function begarCvGranskning(_prev: AiSvar, _form: FormData): Promise<AiSvar> {
  const user = await requireUser();
  if (!aiArPakopplad()) return { error: 'AI-funktionerna är inte påslagna.' };

  const kvot = await kontrolleraKvot({ userId: user.id }, 'GRANSKNING');
  if (!kvot.ok) return { error: kvot.error };

  const fullstandig = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
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
    },
  });
  if (!fullstandig) return { error: 'Kunde inte läsa ditt CV.' };

  const resultat = await granskaCv(byggKandidatunderlag(fullstandig));
  await loggaAnrop({ userId: user.id }, 'GRANSKNING', resultat.forbrukning, resultat.ok);

  if (!resultat.ok) return { error: 'Granskningen gick inte att genomföra just nu. Försök igen.' };

  await prisma.cvReview.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      summary: resultat.data.summary,
      suggestions: JSON.stringify(resultat.data.suggestions),
      completeness: resultat.data.completeness,
      cvVersion: fullstandig.cvUpdatedAt,
    },
    update: {
      summary: resultat.data.summary,
      suggestions: JSON.stringify(resultat.data.suggestions),
      completeness: resultat.data.completeness,
      cvVersion: fullstandig.cvUpdatedAt,
      createdAt: new Date(),
    },
  });

  revalidatePath('/kandidat/cv');
  return { ok: `Granskning klar. Du har ${kvot.kvarIDag - 1} kvar i dag.` };
}
