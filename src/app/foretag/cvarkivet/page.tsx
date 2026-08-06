import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireCompany } from '@/lib/session';
import { arGodkant, harCvAtkomst, KATEGORIER, KOMMUNER_MED_DISTANS } from '@/lib/data';
import GranskningNotis from '@/components/GranskningNotis';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { ageFromBirthDate, kr } from '@/lib/utils';
import { hiddenUserIdsForCompany } from '@/lib/visibility';
import { contains } from '@/lib/search';
import Paywall from '@/components/Paywall';
import { toggleHeart } from '@/app/actions/company';

export const dynamic = 'force-dynamic';

export default async function CvArkivetPage({
  searchParams,
}: {
  searchParams: {
    kommun?: string;
    kategori?: string;
    q?: string;
    hjartade?: string;
    favoriter?: string;
    aktiva?: string;
  };
}) {
  const company = await requireCompany();

  if (!arGodkant(company)) {
    return (
      <>
        <PageHeader title="CVArkivet" />
        <GranskningNotis status={company.status} reviewNote={company.reviewNote} />
      </>
    );
  }

  if (!harCvAtkomst(company)) {
    return (
      <>
        <PageHeader title="CVArkivet" />
        <Paywall companyType={company.companyType} />
      </>
    );
  }

  const { kommun, kategori, q, hjartade, favoriter, aktiva } = searchParams;
  const hiddenIds = await hiddenUserIdsForCompany(company);

  const [hearts, favs] = await Promise.all([
    prisma.heart.findMany({ where: { companyId: company.id }, select: { userId: true } }),
    prisma.favorite.findMany({ where: { companyId: company.id }, select: { userId: true } }),
  ]);
  const heartSet = new Set(hearts.map((h) => h.userId));
  const favSet = new Set(favs.map((f) => f.userId));

  const candidates = await prisma.user.findMany({
    where: {
      suspended: false,
      id: {
        notIn: hiddenIds,
        ...(hjartade ? { in: Array.from(heartSet) } : {}),
      },
      ...(aktiva === 'ja' ? { activelyLooking: true } : {}),
      ...(kommun
        ? { OR: [{ homeMunicipality: kommun }, { municipalities: { some: { municipality: kommun } } }] }
        : {}),
      ...(kategori ? { categories: { some: { category: kategori } } } : {}),
      ...(q
        ? {
            OR: [
              { firstName: contains(q) },
              { lastName: contains(q) },
              { headline: contains(q) },
              { seeking: contains(q) },
              { skills: contains(q) },
            ],
          }
        : {}),
    },
    include: {
      categories: true,
      municipalities: true,
      _count: { select: { cvViews: true } },
    },
    orderBy: [{ activelyLooking: 'desc' }, { cvUpdatedAt: 'desc' }, { createdAt: 'desc' }],
    take: 300,
  });

  const list = favoriter ? candidates.filter((c) => favSet.has(c.id)) : candidates;

  return (
    <>
      <PageHeader
        title="CVArkivet"
        description="Sök bland registrerade kandidater. Klicka på ett CV för att läsa hela profilen – kandidaten ser att ni har öppnat den."
      />

      <Card className="mb-6">
        <form className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="label">Kommun</label>
            <select name="kommun" defaultValue={kommun ?? ''} className="input">
              <option value="">Alla kommuner</option>
              {KOMMUNER_MED_DISTANS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Kategori</label>
            <select name="kategori" defaultValue={kategori ?? ''} className="input">
              <option value="">Alla kategorier</option>
              {KATEGORIER.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Fritext</label>
            <input
              name="q"
              defaultValue={q ?? ''}
              placeholder="Namn, rubrik eller kompetens"
              className="input"
            />
          </div>
          <div className="flex items-end gap-2">
            <button className="btn-primary flex-1" type="submit">
              Sök
            </button>
            <Link href="/foretag/cvarkivet" className="btn-secondary">
              Rensa
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 md:col-span-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="hjartade"
                value="1"
                defaultChecked={!!hjartade}
                className="h-4 w-4 rounded border-sand-300 text-brand-600"
              />
              Endast hjärtade kandidater
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="favoriter"
                value="1"
                defaultChecked={!!favoriter}
                className="h-4 w-4 rounded border-sand-300 text-brand-600"
              />
              Endast de som valt oss som favorit
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="aktiva"
                value="ja"
                defaultChecked={aktiva === 'ja'}
                className="h-4 w-4 rounded border-sand-300 text-brand-600"
              />
              Endast aktivt jobbsökande
            </label>
          </div>
        </form>
      </Card>

      <p className="muted mb-3">
        {list.length} {list.length === 1 ? 'kandidat' : 'kandidater'}
      </p>

      {list.length === 0 ? (
        <Empty>Inga kandidater matchar er sökning.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-sand-200 bg-white">
          <table className="min-w-full">
            <thead className="border-b border-sand-200 bg-sand-50">
              <tr>
                <th className="th w-10"></th>
                <th className="th">Kandidat</th>
                <th className="th">Kommun</th>
                <th className="th">Kategorier</th>
                <th className="th">Löneanspråk</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-sand-50">
                  <td className="td">
                    <form action={toggleHeart}>
                      <input type="hidden" name="userId" value={c.id} />
                      <button
                        type="submit"
                        title={heartSet.has(c.id) ? 'Ta bort hjärta' : 'Hjärta kandidaten'}
                        className={`text-xl leading-none ${
                          heartSet.has(c.id) ? 'text-pink-500' : 'text-sand-300 hover:text-pink-400'
                        }`}
                      >
                        {heartSet.has(c.id) ? '♥' : '♡'}
                      </button>
                    </form>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      {c.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.photoUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full border border-sand-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand-100 text-xs font-semibold text-sand-400">
                          {c.firstName.slice(0, 1)}
                          {c.lastName.slice(0, 1)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/foretag/cvarkivet/${c.id}`}
                          className="font-medium text-brand-600 hover:underline"
                        >
                          {c.firstName} {c.lastName}
                        </Link>
                        <p className="muted">
                          {c.headline || 'Ingen yrkesrubrik'}
                          {ageFromBirthDate(c.birthDate) !== null &&
                            ` · ${ageFromBirthDate(c.birthDate)} år`}
                        </p>
                        {c.seeking && (
                          <p className="mt-0.5 text-sm font-medium text-brand-700">
                            Söker: {c.seeking}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    {c.homeMunicipality || '–'}
                    {c.municipalities.length > 0 && (
                      <p className="muted">
                        Söker i: {c.municipalities.map((m) => m.municipality).join(', ')}
                      </p>
                    )}
                  </td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {c.categories.length === 0 && <span className="muted">–</span>}
                      {c.categories.slice(0, 3).map((k) => (
                        <Badge key={k.id} tone="blue">
                          {k.category}
                        </Badge>
                      ))}
                      {c.categories.length > 3 && (
                        <Badge>+{c.categories.length - 3}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="td">{c.salaryExpectation ? kr(c.salaryExpectation) : '–'}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {c.activelyLooking ? (
                        <Badge tone="green">Söker aktivt</Badge>
                      ) : (
                        <Badge tone="slate">Passiv</Badge>
                      )}
                      {favSet.has(c.id) && <Badge tone="pink">★ Har oss som favorit</Badge>}
                    </div>
                  </td>
                  <td className="td">
                    <Link href={`/foretag/cvarkivet/${c.id}`} className="btn-secondary">
                      Öppna CV
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
