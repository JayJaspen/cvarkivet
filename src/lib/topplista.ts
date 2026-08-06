import 'server-only';
import { prisma } from './db';

export type Topplisteplats = {
  plats: number;
  id: string;
  namn: string;
  kommun: string;
  logoUrl: string | null;
  foljare: number;
  aktivaAnnonser: number;
};

/**
 * Topp 50 företag efter antal följare.
 *
 * "Följare" är kandidater som markerat företaget som favorit. Bara godkända
 * och aktiva företag räknas – ogranskade konton ska inte kunna klättra i en
 * lista som är synlig för alla.
 */
export async function hamtaTopplista(antal = 50): Promise<Topplisteplats[]> {
  const grupperat = await prisma.favorite.groupBy({
    by: ['companyId'],
    _count: { _all: true },
    orderBy: { _count: { companyId: 'desc' } },
    take: antal * 2, // marginal, en del faller bort i filtreringen nedan
  });

  if (grupperat.length === 0) return [];

  const foretag = await prisma.company.findMany({
    where: {
      id: { in: grupperat.map((g) => g.companyId) },
      suspended: false,
      status: 'APPROVED',
    },
    select: {
      id: true,
      name: true,
      municipality: true,
      logoUrl: true,
      _count: { select: { jobAds: true } },
    },
  });

  const perId = new Map(foretag.map((f) => [f.id, f]));

  return grupperat
    .filter((g) => perId.has(g.companyId))
    .slice(0, antal)
    .map((g, i) => {
      const f = perId.get(g.companyId)!;
      return {
        plats: i + 1,
        id: f.id,
        namn: f.name,
        kommun: f.municipality,
        logoUrl: f.logoUrl,
        foljare: g._count._all,
        aktivaAnnonser: f._count.jobAds,
      };
    });
}
