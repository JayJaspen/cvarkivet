import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { pris, bolagstypText, fakturasattText } from '@/lib/data';

export const dynamic = 'force-dynamic';

/** Escapar ett fält enligt CSV-reglerna. */
function f(varde: unknown): string {
  const s = varde === null || varde === undefined ? '' : String(varde);
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
}

/**
 * Faktureringsunderlag som CSV.
 *
 * Semikolon som avgränsare och BOM i början, så att Excel på svenska
 * Windows öppnar filen korrekt utan importguide.
 */
export async function GET(request: Request) {
  await requireAdmin();

  const url = new URL(request.url);
  const bara = url.searchParams.get('plan'); // YEARLY | MONTHLY | NONE

  const foretag = await prisma.company.findMany({
    where: bara ? { subscription: bara } : {},
    orderBy: { name: 'asc' },
    include: { _count: { select: { jobAds: true, cvViews: true } } },
  });

  const rubriker = [
    'Företagsnamn',
    'Organisationsnummer',
    'Bolagstyp',
    'Prenumeration',
    'Belopp exkl moms',
    'Startdatum',
    'Gäller till',
    'Uppsagt',
    'Faktureringssätt',
    'Fakturamottagare',
    'Er referens',
    'Kontaktperson',
    'E-post',
    'Telefon',
    'Besöksadress',
    'Kommun',
    'Status',
    'Avstängd',
    'Registrerad',
    'Antal annonser',
    'Lästa CV',
  ];

  const rader = foretag.map((c) => {
    const belopp =
      c.subscription === 'NONE' ? 0 : pris(c.companyType, c.subscription as 'YEARLY' | 'MONTHLY');

    return [
      c.name,
      c.orgNumber,
      bolagstypText(c.companyType),
      c.subscription === 'NONE'
        ? 'Ingen'
        : c.subscription === 'YEARLY'
          ? 'Årsabonnemang'
          : 'Månadsabonnemang',
      belopp,
      c.subscriptionStarted?.toLocaleDateString('sv-SE') ?? '',
      c.subscriptionEndsAt?.toLocaleDateString('sv-SE') ?? '',
      c.cancelledAt?.toLocaleDateString('sv-SE') ?? '',
      fakturasattText(c.invoiceMethod),
      c.invoiceMethod === 'EMAIL' ? c.invoiceEmail : c.invoiceAddress,
      c.invoiceRef,
      c.contactName,
      c.email,
      c.phone,
      c.address,
      c.municipality,
      c.status === 'APPROVED' ? 'Godkänt' : c.status === 'PENDING' ? 'Väntar' : 'Avslaget',
      c.suspended ? 'Ja' : 'Nej',
      c.createdAt.toLocaleDateString('sv-SE'),
      c._count.jobAds,
      c._count.cvViews,
    ].map(f).join(';');
  });

  const csv = '﻿' + [rubriker.map(f).join(';'), ...rader].join('\r\n');
  const datum = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="cvarkivet-foretag-${datum}.csv"`,
    },
  });
}
