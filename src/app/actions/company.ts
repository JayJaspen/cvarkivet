'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireCompany } from '@/lib/session';
import { uploadLogo } from '@/lib/storage';
import { harAnnonsAtkomst, harCvAtkomst } from '@/lib/data';
import { monthsFromNow, normalizeDomain, validEmail } from '@/lib/utils';

export type FormState = { error?: string; ok?: string } | undefined;

// ------------------------------------------------------------- Företagsprofil

export async function updateCompany(_prev: FormState, form: FormData): Promise<FormState> {
  const company = await requireCompany();

  const name = String(form.get('name') ?? '').trim();
  const contactName = String(form.get('contactName') ?? '').trim();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const phone = String(form.get('phone') ?? '').trim();
  const address = String(form.get('address') ?? '').trim();
  const municipality = String(form.get('municipality') ?? '').trim();
  const website = normalizeDomain(String(form.get('website') ?? ''));
  const presentation = String(form.get('presentation') ?? '').trim();

  if (!name) return { error: 'Ange företagsnamn.' };
  if (!validEmail(email)) return { error: 'Ange en giltig e-postadress.' };
  if (!municipality) return { error: 'Välj hemmahörande kommun.' };

  if (email !== company.email) {
    const taken =
      (await prisma.company.findUnique({ where: { email } })) ||
      (await prisma.user.findUnique({ where: { email } }));
    if (taken) return { error: 'E-postadressen används redan.' };
  }

  // Logotyp – Vercel Blob i produktion, lokal disk vid utveckling
  let logoUrl = company.logoUrl;
  const logo = form.get('logo') as File | null;
  if (logo && typeof logo === 'object' && logo.size > 0) {
    const result = await uploadLogo(logo, company.id);
    if ('error' in result) return { error: result.error };
    logoUrl = result.url;
  }

  await prisma.company.update({
    where: { id: company.id },
    data: {
      name,
      contactName,
      email,
      phone,
      address,
      municipality,
      website: website || null,
      presentation: presentation || null,
      logoUrl,
    },
  });

  revalidatePath('/foretag/var-sida');
  return { ok: 'Uppgifterna är sparade.' };
}

export async function changeCompanyPassword(
  _prev: FormState,
  form: FormData
): Promise<FormState> {
  const company = await requireCompany();
  const current = String(form.get('current') ?? '');
  const next = String(form.get('next') ?? '');
  const next2 = String(form.get('next2') ?? '');

  if (!(await bcrypt.compare(current, company.passwordHash)))
    return { error: 'Nuvarande lösenord stämmer inte.' };
  if (next.length < 8) return { error: 'Nytt lösenord måste vara minst 8 tecken.' };
  if (next !== next2) return { error: 'De nya lösenorden matchar inte.' };

  await prisma.company.update({
    where: { id: company.id },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });
  return { ok: 'Lösenordet är uppdaterat.' };
}

// ------------------------------------------------------------- Prenumeration

export async function activateSubscription(form: FormData) {
  const company = await requireCompany();
  const plan = String(form.get('plan'));
  if (!['CV', 'CV_ADS'].includes(plan)) return;

  // Karens: 2 månader efter uppsägning
  if (company.blockedUntil && company.blockedUntil > new Date()) return;

  await prisma.$transaction([
    prisma.company.update({
      where: { id: company.id },
      data: {
        subscription: plan,
        subscriptionStarted: company.subscriptionStarted ?? new Date(),
        cancelledAt: null,
      },
    }),
    prisma.subscriptionEvent.create({
      data: {
        companyId: company.id,
        type: company.subscription === 'NONE' ? 'ACTIVATED' : 'CHANGED',
        plan,
      },
    }),
  ]);

  revalidatePath('/foretag/var-sida');
  revalidatePath('/foretag/cvarkivet');
}

export async function cancelSubscription() {
  const company = await requireCompany();
  if (company.subscription === 'NONE') return;

  await prisma.$transaction([
    prisma.company.update({
      where: { id: company.id },
      data: {
        subscription: 'NONE',
        cancelledAt: new Date(),
        subscriptionStarted: null,
        blockedUntil: monthsFromNow(2), // kan inte teckna nytt inom 2 månader
      },
    }),
    prisma.subscriptionEvent.create({
      data: { companyId: company.id, type: 'CANCELLED', plan: company.subscription },
    }),
  ]);

  revalidatePath('/foretag/var-sida');
  revalidatePath('/foretag/cvarkivet');
}

// ------------------------------------------------------------------ Annonser

export async function saveJobAd(_prev: FormState, form: FormData): Promise<FormState> {
  const company = await requireCompany();
  if (!harAnnonsAtkomst(company.subscription))
    return { error: 'Annonsering kräver prenumerationen CV + Annonspaket.' };

  const id = String(form.get('id') ?? '');
  const title = String(form.get('title') ?? '').trim();
  const body = String(form.get('body') ?? '').trim();
  const applyEmail = String(form.get('applyEmail') ?? '').trim();
  const applyUrl = String(form.get('applyUrl') ?? '').trim();
  const deadlineRaw = String(form.get('deadline') ?? '');
  const municipality = String(form.get('municipality') ?? '').trim();
  const category = String(form.get('category') ?? '').trim();
  const salaryMin = String(form.get('salaryMin') ?? '').replace(/\D/g, '');
  const salaryMax = String(form.get('salaryMax') ?? '').replace(/\D/g, '');

  if (!title) return { error: 'Ange en rubrik.' };
  if (!body) return { error: 'Skriv en annonstext.' };
  if (!municipality) return { error: 'Välj kommun.' };
  if (!category) return { error: 'Välj kategori.' };
  if (!applyEmail && !applyUrl)
    return { error: 'Ange e-postadress eller länk till rekryteringssystem för ansökan.' };
  if (applyEmail && !validEmail(applyEmail)) return { error: 'Ogiltig e-postadress för ansökan.' };

  const deadline = new Date(deadlineRaw);
  if (Number.isNaN(deadline.getTime())) return { error: 'Ange sista ansökningsdatum.' };
  deadline.setHours(23, 59, 59, 999);

  const data = {
    title,
    body,
    applyEmail: applyEmail || null,
    applyUrl: applyUrl ? (applyUrl.startsWith('http') ? applyUrl : `https://${applyUrl}`) : null,
    deadline,
    municipality,
    category,
    salaryMin: salaryMin ? Number(salaryMin) : null,
    salaryMax: salaryMax ? Number(salaryMax) : null,
  };

  if (id) {
    await prisma.jobAd.updateMany({ where: { id, companyId: company.id }, data });
  } else {
    await prisma.jobAd.create({ data: { ...data, companyId: company.id } });
  }

  revalidatePath('/foretag/annonser');
  return { ok: id ? 'Annonsen är uppdaterad.' : 'Annonsen är publicerad.' };
}

export async function deleteJobAd(form: FormData) {
  const company = await requireCompany();
  await prisma.jobAd.deleteMany({
    where: { id: String(form.get('id')), companyId: company.id },
  });
  revalidatePath('/foretag/annonser');
}

// ------------------------------------------------------- CVArkivet-funktioner

export async function toggleHeart(form: FormData) {
  const company = await requireCompany();
  if (!harCvAtkomst(company.subscription)) return;

  const userId = String(form.get('userId'));
  const existing = await prisma.heart.findUnique({
    where: { companyId_userId: { companyId: company.id, userId } },
  });
  if (existing) await prisma.heart.delete({ where: { id: existing.id } });
  else await prisma.heart.create({ data: { companyId: company.id, userId } });

  revalidatePath('/foretag/cvarkivet');
  revalidatePath(`/foretag/cvarkivet/${userId}`);
}

export async function messageCandidate(form: FormData) {
  const company = await requireCompany();
  if (!harCvAtkomst(company.subscription)) return;

  const userId = String(form.get('userId'));
  const body = String(form.get('body') ?? '').trim();
  if (!body) return;

  await prisma.message.create({
    data: { companyId: company.id, userId, senderType: 'COMPANY', body },
  });
  revalidatePath('/foretag/meddelanden');
  revalidatePath(`/foretag/cvarkivet/${userId}`);
}

export async function markCompanyMessagesRead(userId: string) {
  const company = await requireCompany();
  await prisma.message.updateMany({
    where: { companyId: company.id, userId, senderType: 'USER', readAt: null },
    data: { readAt: new Date() },
  });
}
