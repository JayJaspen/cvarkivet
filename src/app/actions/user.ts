'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser, destroySession } from '@/lib/session';
import { epostUpptagen } from '@/lib/epost-upptagen';
import { normalizeDomain, validBirthDate, validEmail } from '@/lib/utils';
import { uploadProfilePhoto } from '@/lib/storage';
import { appUrl, interestReceivedEmail, sendEmail } from '@/lib/email';

export type FormState = { error?: string; ok?: string } | undefined;

// ------------------------------------------------------------------- Mitt CV

export async function saveCv(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();

  const salaryRaw = String(form.get('salaryExpectation') ?? '').replace(/\D/g, '');
  const categories = form.getAll('categories').map(String).filter(Boolean);
  const municipalities = form.getAll('municipalities').map(String).filter(Boolean);

  // Profilbild – frivillig
  let photoUrl = user.photoUrl;
  const photo = form.get('photo') as File | null;
  if (photo && typeof photo === 'object' && photo.size > 0) {
    const result = await uploadProfilePhoto(photo, user.id);
    if ('error' in result) return { error: result.error };
    photoUrl = result.url;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        photoUrl,
        homeMunicipality: String(form.get('homeMunicipality') ?? '').trim() || null,
        headline: String(form.get('headline') ?? '').trim() || null,
        seeking: String(form.get('seeking') ?? '').trim().slice(0, 80) || null,
        summary: String(form.get('summary') ?? '').trim() || null,
        coverLetter: String(form.get('coverLetter') ?? '').trim() || null,
        skills: String(form.get('skills') ?? '').trim() || null,
        languages: String(form.get('languages') ?? '').trim() || null,
        drivingLicense: String(form.get('drivingLicense') ?? '').trim() || null,
        activelyLooking: form.get('activelyLooking') === 'ja',
        salaryExpectation: salaryRaw ? Number(salaryRaw) : null,
        openToRemote: municipalities.includes('Distans'),
        cvUpdatedAt: new Date(),
      },
    }),
    prisma.userCategory.deleteMany({ where: { userId: user.id } }),
    prisma.userMunicipality.deleteMany({ where: { userId: user.id } }),
    prisma.userCategory.createMany({
      data: categories.map((category) => ({ userId: user.id, category })),
    }),
    prisma.userMunicipality.createMany({
      data: municipalities.map((municipality) => ({ userId: user.id, municipality })),
    }),
  ]);

  revalidatePath('/kandidat/cv');
  return { ok: 'CV:t är sparat.' };
}

export async function removePhoto() {
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { photoUrl: null } });
  revalidatePath('/kandidat/cv');
}

export async function addExperience(form: FormData) {
  const user = await requireUser();
  const title = String(form.get('title') ?? '').trim();
  const employer = String(form.get('employer') ?? '').trim();
  if (!title || !employer) return;

  await prisma.experience.create({
    data: {
      userId: user.id,
      title,
      employer,
      location: String(form.get('location') ?? '').trim() || null,
      fromDate: String(form.get('fromDate') ?? '').trim(),
      toDate: String(form.get('toDate') ?? '').trim() || null,
      description: String(form.get('description') ?? '').trim() || null,
    },
  });
  revalidatePath('/kandidat/cv');
}

export async function deleteExperience(form: FormData) {
  const user = await requireUser();
  await prisma.experience.deleteMany({
    where: { id: String(form.get('id')), userId: user.id },
  });
  revalidatePath('/kandidat/cv');
}

export async function addEducation(form: FormData) {
  const user = await requireUser();
  const program = String(form.get('program') ?? '').trim();
  const school = String(form.get('school') ?? '').trim();
  if (!program || !school) return;

  await prisma.education.create({
    data: {
      userId: user.id,
      program,
      school,
      fromDate: String(form.get('fromDate') ?? '').trim(),
      toDate: String(form.get('toDate') ?? '').trim() || null,
    },
  });
  revalidatePath('/kandidat/cv');
}

export async function deleteEducation(form: FormData) {
  const user = await requireUser();
  await prisma.education.deleteMany({
    where: { id: String(form.get('id')), userId: user.id },
  });
  revalidatePath('/kandidat/cv');
}

// ------------------------------------------------- Favoriter & dolda företag

export async function toggleFavorite(form: FormData) {
  const user = await requireUser();
  const companyId = String(form.get('companyId'));
  const existing = await prisma.favorite.findUnique({
    where: { userId_companyId: { userId: user.id, companyId } },
  });
  if (existing) await prisma.favorite.delete({ where: { id: existing.id } });
  else await prisma.favorite.create({ data: { userId: user.id, companyId } });

  revalidatePath('/kandidat/foretag');
  revalidatePath(`/kandidat/foretag/${companyId}`);
}

export async function toggleHiddenCompany(form: FormData) {
  const user = await requireUser();
  const companyId = String(form.get('companyId'));
  const existing = await prisma.hiddenCompany.findUnique({
    where: { userId_companyId: { userId: user.id, companyId } },
  });
  if (existing) await prisma.hiddenCompany.delete({ where: { id: existing.id } });
  else await prisma.hiddenCompany.create({ data: { userId: user.id, companyId } });

  revalidatePath('/kandidat/foretag');
  revalidatePath(`/kandidat/foretag/${companyId}`);
  revalidatePath('/kandidat/min-sida');
}

export async function addHiddenDomain(form: FormData) {
  const user = await requireUser();
  const domain = normalizeDomain(String(form.get('domain') ?? ''));
  if (!domain || !domain.includes('.')) return;

  await prisma.hiddenDomain.upsert({
    where: { userId_domain: { userId: user.id, domain } },
    create: { userId: user.id, domain },
    update: {},
  });
  revalidatePath('/kandidat/min-sida');
}

export async function removeHiddenDomain(form: FormData) {
  const user = await requireUser();
  await prisma.hiddenDomain.deleteMany({
    where: { id: String(form.get('id')), userId: user.id },
  });
  revalidatePath('/kandidat/min-sida');
}

// ------------------------------------------------------------------ Min sida

export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();

  const firstName = String(form.get('firstName') ?? '').trim();
  const lastName = String(form.get('lastName') ?? '').trim();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const phone = String(form.get('phone') ?? '').trim();
  const birthDate = validBirthDate(String(form.get('birthDate') ?? ''));

  if (!firstName || !lastName) return { error: 'Fyll i för- och efternamn.' };
  if (!validEmail(email)) return { error: 'Ange en giltig e-postadress.' };
  if (!birthDate) return { error: 'Ange födelsedatum som ÅÅÅÅMMDD.' };

  if (email !== user.email && (await epostUpptagen(email, { userId: user.id })))
    return { error: 'E-postadressen används redan.' };

  await prisma.user.update({
    where: { id: user.id },
    data: { firstName, lastName, email, phone, birthDate },
  });

  revalidatePath('/kandidat/min-sida');
  return { ok: 'Uppgifterna är sparade.' };
}

export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(form.get('current') ?? '');
  const next = String(form.get('next') ?? '');
  const next2 = String(form.get('next2') ?? '');

  if (!(await bcrypt.compare(current, user.passwordHash)))
    return { error: 'Nuvarande lösenord stämmer inte.' };
  if (next.length < 8) return { error: 'Nytt lösenord måste vara minst 8 tecken.' };
  if (next !== next2) return { error: 'De nya lösenorden matchar inte.' };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });
  return { ok: 'Lösenordet är uppdaterat.' };
}

export async function toggleCvViewNotifications() {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { notifyOnCvView: !user.notifyOnCvView },
  });
  revalidatePath('/kandidat/min-sida');
}

export async function deleteAccount() {
  const user = await requireUser();
  await prisma.user.delete({ where: { id: user.id } });
  destroySession();
  redirect('/');
}

// ---------------------------------------------------------------- Ansökningar

/**
 * Kandidaten anmäler intresse för en annons utan att mejla.
 * Företaget ser anmälan och kan ta kontakt själv.
 */
export async function visaIntresse(form: FormData) {
  const user = await requireUser();
  const jobAdId = String(form.get('jobAdId'));
  const message = String(form.get('message') ?? '').trim() || null;

  const annons = await prisma.jobAd.findUnique({
    where: { id: jobAdId },
    include: { company: { select: { id: true, name: true, email: true } } },
  });
  if (!annons || annons.deadline < new Date()) return;

  await prisma.interest.upsert({
    where: { userId_jobAdId: { userId: user.id, jobAdId } },
    create: { userId: user.id, jobAdId, message },
    update: { message },
  });

  const mail = interestReceivedEmail(
    annons.company.name,
    `${user.firstName} ${user.lastName}`,
    annons.title,
    appUrl(`/foretag/annonser/${jobAdId}`)
  );
  await sendEmail({ to: annons.company.email, ...mail });

  revalidatePath('/kandidat/jobb');
}

export async function taBortIntresse(form: FormData) {
  const user = await requireUser();
  await prisma.interest.deleteMany({
    where: { userId: user.id, jobAdId: String(form.get('jobAdId')) },
  });
  revalidatePath('/kandidat/jobb');
}

// ---------------------------------------------------------------- Meddelanden

export async function replyToCompany(form: FormData) {
  const user = await requireUser();
  const companyId = String(form.get('companyId'));
  const body = String(form.get('body') ?? '').trim();
  if (!body) return;

  await prisma.message.create({
    data: { companyId, userId: user.id, senderType: 'USER', body },
  });
  revalidatePath('/kandidat/meddelanden');
}

export async function markMessagesRead(companyId: string) {
  const user = await requireUser();
  await prisma.message.updateMany({
    where: { companyId, userId: user.id, senderType: 'COMPANY', readAt: null },
    data: { readAt: new Date() },
  });
}
