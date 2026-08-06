'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireCompany } from '@/lib/session';
import { epostUpptagen } from '@/lib/epost-upptagen';
import { hiddenUserIdsForCompany } from '@/lib/visibility';
import { uploadLogo } from '@/lib/storage';
import { arGodkant, harAnnonsAtkomst, harCvAtkomst } from '@/lib/data';
import { normalizeDomain, validEmail } from '@/lib/utils';

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

  if (email !== company.email && (await epostUpptagen(email, { companyId: company.id })))
    return { error: 'E-postadressen används redan.' };

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

/** Kontrollerar fakturauppgifterna som skickats med formuläret. */
function lasFakturauppgifter(form: FormData):
  | { ok: true; data: { invoiceMethod: string; invoiceAddress: string | null; invoiceEmail: string | null; invoiceRef: string | null } }
  | { ok: false; error: string } {
  const invoiceMethod = String(form.get('invoiceMethod') ?? '');
  const invoiceRef = String(form.get('invoiceRef') ?? '').trim() || null;

  if (invoiceMethod === 'EMAIL') {
    const invoiceEmail = String(form.get('invoiceEmail') ?? '').trim().toLowerCase();
    if (!validEmail(invoiceEmail))
      return { ok: false, error: 'Ange en giltig e-postadress för fakturan.' };
    return { ok: true, data: { invoiceMethod, invoiceEmail, invoiceAddress: null, invoiceRef } };
  }

  if (invoiceMethod === 'PAPER') {
    const invoiceAddress = String(form.get('invoiceAddress') ?? '').trim();
    if (invoiceAddress.length < 5)
      return { ok: false, error: 'Ange en fullständig fakturaadress.' };
    return { ok: true, data: { invoiceMethod, invoiceAddress, invoiceEmail: null, invoiceRef } };
  }

  return { ok: false, error: 'Välj hur ni vill ta emot fakturan.' };
}

export async function activateSubscription(
  _prev: FormState,
  form: FormData
): Promise<FormState> {
  const company = await requireCompany();

  // Ingen prenumeration innan kontot är granskat och godkänt.
  if (!arGodkant(company))
    return {
      error: 'Kontot är inte godkänt ännu. Abonnemang kan tecknas när granskningen är klar.',
    };

  const faktura = lasFakturauppgifter(form);
  if (!faktura.ok) return { error: faktura.error };

  // Ett enda abonnemang finns: helår, räknat från i dag.
  const subscriptionEndsAt = new Date();
  subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);

  await prisma.$transaction([
    prisma.company.update({
      where: { id: company.id },
      data: {
        subscription: 'YEARLY',
        subscriptionStarted: new Date(),
        subscriptionEndsAt,
        cancelledAt: null,
        ...faktura.data,
      },
    }),
    prisma.subscriptionEvent.create({
      data: {
        companyId: company.id,
        type: company.subscription === 'NONE' ? 'ACTIVATED' : 'CHANGED',
        plan: `YEARLY_${company.companyType}`,
      },
    }),
  ]);

  revalidatePath('/foretag/var-sida');
  revalidatePath('/foretag/cvarkivet');
  revalidatePath('/foretag/annonser');

  return {
    ok: `Årsabonnemanget är aktiverat och gäller till ${subscriptionEndsAt.toLocaleDateString('sv-SE')}.`,
  };
}

/** Ändra faktureringssätt utan att röra prenumerationen. */
export async function updateInvoiceSettings(
  _prev: FormState,
  form: FormData
): Promise<FormState> {
  const company = await requireCompany();

  const faktura = lasFakturauppgifter(form);
  if (!faktura.ok) return { error: faktura.error };

  await prisma.company.update({ where: { id: company.id }, data: faktura.data });
  revalidatePath('/foretag/var-sida');
  return { ok: 'Faktureringsuppgifterna är sparade.' };
}

export async function cancelSubscription() {
  const company = await requireCompany();
  if (company.subscription === 'NONE') return;

  await prisma.$transaction([
    prisma.company.update({
      where: { id: company.id },
      data: {
        // Uppsägning betyder att abonnemanget inte förnyas. Åtkomsten löper
        // vidare till slutdatumet de redan betalat för – ett år är betalt i
        // förskott och ska inte tas ifrån dem i förtid.
        cancelledAt: new Date(),

        // Saknas slutdatum (gammalt månadsabonnemang) sätts ett direkt, så att
        // gallringsjobbet kan avsluta det på vanligt sätt.
        ...(company.subscriptionEndsAt ? {} : { subscriptionEndsAt: new Date() }),
      },
    }),
    prisma.subscriptionEvent.create({
      data: {
        companyId: company.id,
        type: 'CANCELLED',
        plan: `${company.subscription}_${company.companyType}`,
      },
    }),
  ]);

  revalidatePath('/foretag/var-sida');
  revalidatePath('/foretag/cvarkivet');
  revalidatePath('/foretag/annonser');
}

// ------------------------------------------------------------------ Annonser

export async function saveJobAd(_prev: FormState, form: FormData): Promise<FormState> {
  const company = await requireCompany();
  if (!arGodkant(company))
    return { error: 'Kontot är inte godkänt ännu. Du kan publicera annonser när granskningen är klar.' };
  if (!harAnnonsAtkomst(company))
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
  if (!harCvAtkomst(company)) return;

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
  if (!harCvAtkomst(company)) return;

  const userId = String(form.get('userId'));
  const body = String(form.get('body') ?? '').trim();
  if (!body) return;

  // En kandidat som dolt sig för företaget ska inte gå att kontakta ens med
  // ett gissat id. Kontrollen fanns i sökningen men saknades här.
  const dolda = await hiddenUserIdsForCompany(company);
  if (dolda.includes(userId)) return;

  const mottagare = await prisma.user.findFirst({
    where: { id: userId, suspended: false },
    select: { id: true },
  });
  if (!mottagare) return;

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
