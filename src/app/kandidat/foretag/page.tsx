import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { foretagIKommun, KOMMUNER_FORETAG } from '@/lib/data';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { toggleFavorite, toggleHiddenCompany } from '@/app/actions/user';
import { contains } from '@/lib/search';

export const dynamic = 'force-dynamic';

export default async function ForetagPage({
  searchParams,
}: {
  searchParams: { q?: string; kommun?: string; visa?: string };
}) {
  const user = await requireUser();
  const { q, kommun, visa } = searchParams;

  const [companies, favorites, hidden] = await Promise.all([
    prisma.company.findMany({
      where: {
        suspended: false,
        status: 'APPROVED', // ogranskade företag syns inte för kandidaterna
        ...(q ? { name: contains(q) } : {}),
        ...(kommun ? foretagIKommun(kommun) : {}),
      },
      orderBy: { name: 'asc' },
      include: { _count: { select: { jobAds: true } } },
    }),
    prisma.favorite.findMany({ where: { userId: user.id }, select: { companyId: true } }),
    prisma.hiddenCompany.findMany({ where: { userId: user.id }, select: { companyId: true } }),
  ]);

  const favSet = new Set(favorites.map((f) => f.companyId));
  const hidSet = new Set(hidden.map((h) => h.companyId));

  const list = companies.filter((c) => {
    if (visa === 'favoriter') return favSet.has(c.id);
    if (visa === 'dolda') return hidSet.has(c.id);
    return true;
  });

  return (
    <>
      <PageHeader
        title="Registrerade företag"
        description="Markera dina favoritföretag, eller dölj din profil för ett specifikt företag – då syns du inte i deras CV-sökning."
      />

      <Card className="mb-6">
        <form className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="label">Sök företag</label>
            <input name="q" defaultValue={q ?? ''} placeholder="Företagsnamn" className="input" />
          </div>
          <div>
            <label className="label">Kommun</label>
            <select name="kommun" defaultValue={kommun ?? ''} className="input">
              <option value="">Alla kommuner</option>
              {KOMMUNER_FORETAG.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Visa</label>
            <select name="visa" defaultValue={visa ?? ''} className="input">
              <option value="">Alla företag</option>
              <option value="favoriter">Endast favoriter</option>
              <option value="dolda">Endast dolda</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="btn-primary flex-1" type="submit">
              Filtrera
            </button>
            <Link href="/kandidat/foretag" className="btn-secondary">
              Rensa
            </Link>
          </div>
        </form>
      </Card>

      {list.length === 0 ? (
        <Empty>Inga företag matchar din sökning.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((c) => {
            const isFav = favSet.has(c.id);
            const isHidden = hidSet.has(c.id);
            return (
              <Card key={c.id} className={isHidden ? 'opacity-70' : ''}>
                <div className="flex items-start gap-4">
                  {c.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.logoUrl}
                      alt={c.name}
                      className="h-12 w-12 rounded-lg border border-sand-200 object-contain"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sand-100 text-sm font-bold text-sand-500">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/kandidat/foretag/${c.id}`}
                      className="font-semibold text-sand-900 hover:text-brand-600"
                    >
                      {c.name}
                    </Link>
                    <p className="muted">{c.municipality}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {isFav && <Badge tone="pink">★ Favorit</Badge>}
                      {isHidden && <Badge tone="red">Dold för detta företag</Badge>}
                      {c._count.jobAds > 0 && (
                        <Badge tone="blue">{c._count.jobAds} annonser</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={toggleFavorite}>
                    <input type="hidden" name="companyId" value={c.id} />
                    <button className={isFav ? 'btn-primary' : 'btn-secondary'} type="submit">
                      {isFav ? '★ Favorit' : '☆ Gör till favorit'}
                    </button>
                  </form>
                  <form action={toggleHiddenCompany}>
                    <input type="hidden" name="companyId" value={c.id} />
                    <button className={isHidden ? 'btn-danger' : 'btn-secondary'} type="submit">
                      {isHidden ? 'Visa mig igen' : 'Dölj min profil'}
                    </button>
                  </form>
                  <Link href={`/kandidat/foretag/${c.id}`} className="btn-secondary">
                    Profilsida
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
