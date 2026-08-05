'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { korGallring } from '@/lib/retention';
import { appUrl, companyApprovedEmail, companyRejectedEmail, sendEmail } from '@/lib/email';

export type FormState = { error?: string; ok?: string } | undefined;

export async function changeAdminPassword(
  _prev: FormState,
  form: FormData
): Promise<FormState> {
  const admin = await requireAdmin();
  const current = String(form.get('current') ?? '');
  const next = String(form.get('next') ?? '');
  const next2 = String(form.get('next2') ?? '');

  if (!(await bcrypt.compare(current, admin.passwordHash)))
    return { error: 'Nuvarande lösenord stämmer inte.' };
  if (next.length < 12)
    return { error: 'Adminlösenordet måste vara minst 12 tecken.' };
  if (next !== next2) return { error: 'De nya lösenorden matchar inte.' };
  if (next === current) return { error: 'Välj ett annat lösenord än det nuvarande.' };

  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: await bcrypt.hash(next, 12) },
  });

  return { ok: 'Lösenordet är uppdaterat.' };
}

export async function toggleUserSuspended(form: FormData) {
  await requireAdmin();
  const id = String(form.get('id'));
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;
  await prisma.user.update({ where: { id }, data: { suspended: !user.suspended } });
  revalidatePath('/admin/anvandare');
  revalidatePath(`/admin/anvandare/${id}`);
}

export async function toggleCompanySuspended(form: FormData) {
  await requireAdmin();
  const id = String(form.get('id'));
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) return;
  await prisma.company.update({ where: { id }, data: { suspended: !company.suspended } });
  revalidatePath('/admin/foretag');
  revalidatePath(`/admin/foretag/${id}`);
}

/**
 * Kör gallringen manuellt. Torrkörning visar vad som skulle hända utan att
 * något raderas eller mailas.
 */
export async function korGallringManuellt(form: FormData) {
  await requireAdmin();
  const torrkorning = form.get('lage') === 'torr';
  const resultat = await korGallring(torrkorning);

  revalidatePath('/admin/anvandare');

  const params = new URLSearchParams({
    gallring: torrkorning ? 'torr' : 'skarp',
    varnade: String(resultat.varnadeKandidater),
    raderade: String(resultat.raderadeKandidater),
    foretag: String(resultat.raderadeForetag),
  });
  redirect(`/admin/anvandare?${params.toString()}`);
}

// -------------------------------------------------- Granskning av företag

export async function godkannForetag(form: FormData) {
  await requireAdmin();
  const id = String(form.get('id'));

  const company = await prisma.company.update({
    where: { id },
    data: { status: 'APPROVED', reviewedAt: new Date(), reviewNote: null },
  });

  const mail = companyApprovedEmail(company.contactName, company.name, appUrl('/logga-in'));
  await sendEmail({ to: company.email, ...mail });

  revalidatePath('/admin/foretag');
  revalidatePath(`/admin/foretag/${id}`);
}

export async function avslaForetag(form: FormData) {
  await requireAdmin();
  const id = String(form.get('id'));
  const motivering = String(form.get('motivering') ?? '').trim();

  const company = await prisma.company.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedAt: new Date(),
      reviewNote: motivering || null,
      subscription: 'NONE',
    },
  });

  const mail = companyRejectedEmail(company.contactName, company.name, motivering);
  await sendEmail({ to: company.email, ...mail });

  revalidatePath('/admin/foretag');
  revalidatePath(`/admin/foretag/${id}`);
}

/** Ångra ett beslut och lägga tillbaka företaget i kön. */
export async function aterstallGranskning(form: FormData) {
  await requireAdmin();
  const id = String(form.get('id'));
  await prisma.company.update({
    where: { id },
    data: { status: 'PENDING', reviewedAt: null, reviewNote: null },
  });
  revalidatePath('/admin/foretag');
  revalidatePath(`/admin/foretag/${id}`);
}

/** Admin kan häva karensen om t.ex. ett företag sagt upp av misstag. */
export async function clearCompanyBlock(form: FormData) {
  await requireAdmin();
  const id = String(form.get('id'));
  await prisma.company.update({ where: { id }, data: { blockedUntil: null } });
  revalidatePath(`/admin/foretag/${id}`);
}
