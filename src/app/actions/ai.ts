'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireCompany, requireUser } from '@/lib/session';
import { aiArPakopplad, byggKandidatunderlag, granskaCv } from '@/lib/ai';
import { beraknaForAnnons, hamtaEllerBeraknaMatchning } from '@/lib/matchning';
import { arGodkant, harCvAtkomst } from '@/lib/data';

/** Kandidaten begär matchningspoäng för en annons. */
export async function raknaUtMatchning(form: FormData) {
  const user = await requireUser();
  const jobAdId = String(form.get('jobAdId'));

  await hamtaEllerBeraknaMatchning(user.id, jobAdId);
  revalidatePath('/kandidat/jobb');
}

/** Företaget begär matchning för kandidaterna som anmält intresse. */
export async function raknaUtMatchningForAnnons(form: FormData) {
  const company = await requireCompany();
  if (!arGodkant(company) || !harCvAtkomst(company)) return;

  const jobAdId = String(form.get('jobAdId'));
  const annons = await prisma.jobAd.findUnique({
    where: { id: jobAdId },
    select: { companyId: true, interests: { select: { userId: true } } },
  });
  if (!annons || annons.companyId !== company.id) return;

  await beraknaForAnnons(
    jobAdId,
    annons.interests.map((i) => i.userId)
  );
  revalidatePath(`/foretag/annonser/${jobAdId}`);
}

/** Kandidaten ber om en AI-granskning av sitt CV. */
export async function begarCvGranskning() {
  const user = await requireUser();
  if (!aiArPakopplad()) return;

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
  if (!fullstandig) return;

  const resultat = await granskaCv(byggKandidatunderlag(fullstandig));
  if (!resultat.ok) return;

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
}
