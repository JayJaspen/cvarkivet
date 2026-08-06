'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin, requireUser } from '@/lib/session';
import {
  normaliseraForetagsnamn,
  stadaVisningsnamn,
} from '@/lib/onskelista';
import { normalizeDomain } from '@/lib/utils';

export type FormState = { error?: string; ok?: string } | undefined;

/** Hur många företag en kandidat får önska. Hindrar att någon fyller listan. */
const MAX_PER_KANDIDAT = 15;

// ------------------------------------------------------------- Kandidaten

export async function onskaForetag(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();

  const namn = stadaVisningsnamn(String(form.get('namn') ?? ''));
  const website = normalizeDomain(String(form.get('website') ?? ''));

  if (namn.length < 2) return { error: 'Skriv företagets namn.' };
  if (namn.length > 80) return { error: 'Namnet är för långt.' };

  const slug = normaliseraForetagsnamn(namn);
  if (!slug) return { error: 'Namnet innehåller inga giltiga tecken.' };

  const egnaRoster = await prisma.companyWishVote.count({ where: { userId: user.id } });
  if (egnaRoster >= MAX_PER_KANDIDAT)
    return {
      error: `Du kan önska högst ${MAX_PER_KANDIDAT} företag. Ta bort ett önskemål om du vill lägga till ett nytt.`,
    };

  // Finns företaget redan registrerat? Då är önskemålet onödigt.
  const redanRegistrerat = await prisma.company.findFirst({
    where: { name: { equals: namn, mode: 'insensitive' }, status: 'APPROVED' },
    select: { id: true },
  });
  if (redanRegistrerat)
    return { error: `${namn} finns redan på CVArkivet. Du hittar dem under Registrerade företag.` };

  const onskemal = await prisma.companyWish.upsert({
    where: { slug },
    create: { name: namn, slug, website: website || null },
    update: website ? { website } : {},
  });

  if (onskemal.fulfilledAt)
    return { error: `${onskemal.name} har redan registrerat sig.` };

  await prisma.companyWishVote.upsert({
    where: { wishId_userId: { wishId: onskemal.id, userId: user.id } },
    create: { wishId: onskemal.id, userId: user.id },
    update: {},
  });

  revalidatePath('/kandidat/onskelista');
  revalidatePath('/');

  return {
    ok:
      onskemal.status === 'APPROVED'
        ? `${onskemal.name} är tillagt. Tack!`
        : `${onskemal.name} är tillagt och visas publikt när vi granskat det.`,
  };
}

export async function rostaPaOnskemal(form: FormData) {
  const user = await requireUser();
  const wishId = String(form.get('wishId'));

  const antal = await prisma.companyWishVote.count({ where: { userId: user.id } });
  if (antal >= MAX_PER_KANDIDAT) return;

  await prisma.companyWishVote.upsert({
    where: { wishId_userId: { wishId, userId: user.id } },
    create: { wishId, userId: user.id },
    update: {},
  });

  revalidatePath('/kandidat/onskelista');
  revalidatePath('/');
}

export async function taBortRost(form: FormData) {
  const user = await requireUser();
  await prisma.companyWishVote.deleteMany({
    where: { wishId: String(form.get('wishId')), userId: user.id },
  });
  revalidatePath('/kandidat/onskelista');
  revalidatePath('/');
}

// ------------------------------------------------------------------ Admin

export async function rattaOnskemal(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();

  const id = String(form.get('id'));
  const namn = stadaVisningsnamn(String(form.get('namn') ?? ''));
  const website = normalizeDomain(String(form.get('website') ?? ''));

  if (namn.length < 2) return { error: 'Namnet är för kort.' };

  const slug = normaliseraForetagsnamn(namn);
  const krock = await prisma.companyWish.findUnique({ where: { slug } });

  if (krock && krock.id !== id)
    return {
      error: `"${krock.name}" har samma normaliserade namn. Slå ihop posterna i stället för att byta namn.`,
    };

  await prisma.companyWish.update({
    where: { id },
    data: { name: namn, slug, website: website || null },
  });

  revalidatePath('/admin/onskelista');
  revalidatePath('/');
  return { ok: 'Ändringen är sparad.' };
}

export async function satStatusOnskemal(form: FormData) {
  await requireAdmin();
  const status = String(form.get('status'));
  if (!['PENDING', 'APPROVED', 'HIDDEN'].includes(status)) return;

  await prisma.companyWish.update({
    where: { id: String(form.get('id')) },
    data: { status },
  });

  revalidatePath('/admin/onskelista');
  revalidatePath('/');
}

/** Flyttar rösterna från en post till en annan och raderar den tomma. */
export async function slaIhopOnskemal(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();

  const franId = String(form.get('franId'));
  const tillId = String(form.get('tillId'));
  if (!tillId || franId === tillId) return { error: 'Välj en annan post att slå ihop med.' };

  const [fran, till] = await Promise.all([
    prisma.companyWish.findUnique({ where: { id: franId }, include: { votes: true } }),
    prisma.companyWish.findUnique({ where: { id: tillId } }),
  ]);
  if (!fran || !till) return { error: 'Hittade inte posterna.' };

  // Rösterna flyttas en och en, så att en kandidat som röstat på båda
  // posterna inte hamnar dubbelt.
  for (const rost of fran.votes) {
    await prisma.companyWishVote.upsert({
      where: { wishId_userId: { wishId: till.id, userId: rost.userId } },
      create: { wishId: till.id, userId: rost.userId },
      update: {},
    });
  }

  await prisma.companyWish.delete({ where: { id: fran.id } });

  revalidatePath('/admin/onskelista');
  revalidatePath('/');
  return { ok: `"${fran.name}" är hopslagen med "${till.name}".` };
}

export async function raderaOnskemal(form: FormData) {
  await requireAdmin();
  await prisma.companyWish.delete({ where: { id: String(form.get('id')) } });
  revalidatePath('/admin/onskelista');
  revalidatePath('/');
}

/** Markerar manuellt att företaget registrerat sig, om automatiken missat. */
export async function markeraSomRegistrerat(form: FormData) {
  await requireAdmin();
  await prisma.companyWish.update({
    where: { id: String(form.get('id')) },
    data: { fulfilledAt: new Date() },
  });
  revalidatePath('/admin/onskelista');
  revalidatePath('/');
}
