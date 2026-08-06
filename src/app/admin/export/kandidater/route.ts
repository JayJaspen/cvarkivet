import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { ageFromBirthDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function f(varde: unknown): string {
  const s = varde === null || varde === undefined ? '' : String(varde);
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
}

/**
 * Kandidatlista som CSV.
 *
 * Innehåller personuppgifter – filen ska hanteras därefter och inte skickas
 * vidare. Exporten loggas inte i dagsläget, men den är bara åtkomlig för admin.
 */
export async function GET() {
  await requireAdmin();

  const kandidater = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      categories: true,
      municipalities: true,
      _count: { select: { cvViews: true, interests: true } },
    },
  });

  const rubriker = [
    'Förnamn',
    'Efternamn',
    'Ålder',
    'E-post',
    'Telefon',
    'Yrkesrubrik',
    'Söker tjänst',
    'Hemkommun',
    'Söker aktivt',
    'Löneanspråk',
    'Yrkeskategorier',
    'Aktuella kommuner',
    'Avstängd',
    'Registrerad',
    'Senast aktiv',
    'CV uppdaterat',
    'Visningar av CV',
    'Intresseanmälningar',
  ];

  const rader = kandidater.map((u) =>
    [
      u.firstName,
      u.lastName,
      ageFromBirthDate(u.birthDate) ?? '',
      u.email,
      u.phone,
      u.headline,
      u.seeking,
      u.homeMunicipality,
      u.activelyLooking ? 'Ja' : 'Nej',
      u.salaryExpectation ?? '',
      u.categories.map((c) => c.category).join(', '),
      u.municipalities.map((m) => m.municipality).join(', '),
      u.suspended ? 'Ja' : 'Nej',
      u.createdAt.toLocaleDateString('sv-SE'),
      u.lastLoginAt?.toLocaleDateString('sv-SE') ?? '',
      u.cvUpdatedAt?.toLocaleDateString('sv-SE') ?? '',
      u._count.cvViews,
      u._count.interests,
    ]
      .map(f)
      .join(';')
  );

  const csv = '﻿' + [rubriker.map(f).join(';'), ...rader].join('\r\n');
  const datum = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="cvarkivet-kandidater-${datum}.csv"`,
    },
  });
}
