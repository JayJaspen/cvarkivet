'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { korGallring } from '@/lib/retention';

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

/** Admin kan häva karensen om t.ex. ett företag sagt upp av misstag. */
export async function clearCompanyBlock(form: FormData) {
  await requireAdmin();
  const id = String(form.get('id'));
  await prisma.company.update({ where: { id }, data: { blockedUntil: null } });
  revalidatePath(`/admin/foretag/${id}`);
}
