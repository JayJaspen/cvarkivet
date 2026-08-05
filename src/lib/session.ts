import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { prisma } from './db';

const COOKIE = 'cvarkivet_session';
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'utvecklingsnyckel-byt-ut-i-produktion-minst-32-tecken'
);

export type Role = 'USER' | 'COMPANY' | 'ADMIN';
export type SessionData = { id: string; role: Role };

export async function createSession(id: string, role: Role) {
  const token = await new SignJWT({ id, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

export async function getSession(): Promise<SessionData | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { id: payload.id as string, role: payload.role as Role };
  } catch {
    return null;
  }
}

/**
 * Inloggad kandidat, eller redirect till login. Avstängda konton slängs ut.
 *
 * Insvept i React cache: både layouten och sidan behöver användaren, och utan
 * detta gjordes samma databasfråga två gånger vid varje sidvisning.
 */
export const requireUser = cache(async () => {
  const s = await getSession();
  if (!s || s.role !== 'USER') redirect('/logga-in');
  const user = await prisma.user.findUnique({ where: { id: s.id } });
  if (!user || user.suspended) {
    destroySession();
    redirect('/logga-in?fel=avstangd');
  }
  return user;
});

/** Inloggat företag, eller redirect. */
export const requireCompany = cache(async () => {
  const s = await getSession();
  if (!s || s.role !== 'COMPANY') redirect('/logga-in');
  const company = await prisma.company.findUnique({ where: { id: s.id } });
  if (!company || company.suspended) {
    destroySession();
    redirect('/logga-in?fel=avstangd');
  }
  return company;
});

export const requireAdmin = cache(async () => {
  const s = await getSession();
  if (!s || s.role !== 'ADMIN') redirect('/logga-in');
  const admin = await prisma.admin.findUnique({ where: { id: s.id } });
  if (!admin) {
    destroySession();
    redirect('/logga-in');
  }
  return admin;
});
