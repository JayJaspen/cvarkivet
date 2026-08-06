import 'server-only';
import { prisma } from './db';

/**
 * Normaliserar ett företagsnamn så att stavningsvarianter hamnar på samma post.
 *
 * "Volvo AB", "volvo", "VOLVO  Aktiebolag" och "Volvo ab." blir alla "volvo".
 * Bolagsformen tas bort eftersom nästan ingen skriver den konsekvent.
 */
export function normaliseraForetagsnamn(namn: string): string {
  let s = namn
    .toLowerCase()
    .trim()
    // Ta bort allt som inte är bokstäver, siffror eller mellanslag.
    // Skrivet som teckenklass i stället för \p{L}, som kräver nyare målversion.
    .replace(/[^a-z0-9åäöéèüúíóáøæß\s&-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Vanliga bolagsformer i slutet av namnet
  const bolagsformer = [
    'aktiebolag',
    'ab publ',
    'ab',
    'handelsbolag',
    'hb',
    'kommanditbolag',
    'kb',
    'ekonomisk forening',
    'ekonomisk förening',
    'ef',
    'as',
    'a s',
    'oy',
    'gmbh',
    'ltd',
    'limited',
    'inc',
    'plc',
  ];

  for (const form of bolagsformer) {
    if (s.endsWith(' ' + form)) {
      s = s.slice(0, -(form.length + 1)).trim();
      break;
    }
  }

  return s;
}

/** Snygg visningsform: trimmat och med versal början om användaren skrivit gement. */
export function stadaVisningsnamn(namn: string): string {
  const s = namn.trim().replace(/\s+/g, ' ').slice(0, 80);
  if (!s) return s;
  // Bara om hela namnet är gement – annars respekterar vi användarens versaler
  return s === s.toLowerCase() ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export type Onskepost = {
  id: string;
  namn: string;
  website: string | null;
  roster: number;
  harRostat?: boolean;
};

/** Publik lista: godkända och ännu inte registrerade, mest önskade först. */
export async function hamtaOnskelista(antal = 12, userId?: string): Promise<Onskepost[]> {
  const onskemal = await prisma.companyWish.findMany({
    where: { status: 'APPROVED', fulfilledAt: null },
    include: {
      _count: { select: { votes: true } },
      ...(userId ? { votes: { where: { userId }, select: { id: true } } } : {}),
    },
    orderBy: [{ votes: { _count: 'desc' } }, { createdAt: 'asc' }],
    take: antal,
  });

  return onskemal.map((o) => ({
    id: o.id,
    namn: o.name,
    website: o.website,
    roster: o._count.votes,
    harRostat: userId ? (o as { votes?: unknown[] }).votes!.length > 0 : undefined,
  }));
}

/**
 * Letar upp ett önskemål som matchar ett nyregistrerat företag och markerar
 * det som uppfyllt. Returnerar antalet röster, så att företaget kan få veta
 * hur många som väntat på dem.
 */
export async function markeraOnskemalSomUppfyllt(
  companyId: string,
  foretagsnamn: string
): Promise<number> {
  const slug = normaliseraForetagsnamn(foretagsnamn);
  if (!slug) return 0;

  const onskemal = await prisma.companyWish.findUnique({
    where: { slug },
    include: { _count: { select: { votes: true } } },
  });

  if (!onskemal || onskemal.fulfilledAt) return 0;

  await prisma.companyWish.update({
    where: { id: onskemal.id },
    data: { fulfilledAt: new Date(), fulfilledByCompanyId: companyId },
  });

  return onskemal._count.votes;
}

/** Hur många som önskade det här företaget innan det registrerade sig. */
export async function antalSomOnskade(companyId: string): Promise<number> {
  const onskemal = await prisma.companyWish.findFirst({
    where: { fulfilledByCompanyId: companyId },
    include: { _count: { select: { votes: true } } },
  });
  return onskemal?._count.votes ?? 0;
}
