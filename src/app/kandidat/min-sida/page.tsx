import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import {
  addHiddenDomain,
  removeHiddenDomain,
  toggleHiddenCompany,
  toggleCvViewNotifications,
  deleteAccount,
} from '@/app/actions/user';
import ProfileForms from './ProfileForms';

export const dynamic = 'force-dynamic';

export default async function MinSidaPage() {
  const user = await requireUser();

  const [views, viewers, hiddenDomains, hiddenCompanies, intresseanmalningar] = await Promise.all([
    prisma.cvView.count({ where: { userId: user.id } }),
    prisma.cvView.groupBy({
      by: ['companyId'],
      where: { userId: user.id },
      _count: { _all: true },
      _max: { createdAt: true },
    }),
    prisma.hiddenDomain.findMany({ where: { userId: user.id }, orderBy: { domain: 'asc' } }),
    prisma.hiddenCompany.findMany({
      where: { userId: user.id },
      include: { company: { select: { id: true, name: true } } },
    }),
    prisma.interest.count({ where: { userId: user.id } }),
  ]);

  const nedladdningar = await prisma.cvDownload.findMany({
    where: { userId: user.id },
    include: { company: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const companies = await prisma.company.findMany({
    where: { id: { in: viewers.map((v) => v.companyId) } },
    select: { id: true, name: true, municipality: true },
  });
  const byId = new Map(companies.map((c) => [c.id, c]));

  const viewerRows = viewers
    .map((v) => ({
      company: byId.get(v.companyId),
      count: v._count._all,
      last: v._max.createdAt,
    }))
    .filter((r) => r.company)
    .sort((a, b) => (b.last?.getTime() ?? 0) - (a.last?.getTime() ?? 0));

  return (
    <>
      <PageHeader title="Min sida" description="Dina uppgifter, din statistik och din integritet." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="muted">Visningar av ditt CV</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">{views}</p>
          <p className="mt-1 text-xs text-sand-500">Varje gång ett företag öppnat ditt CV.</p>
        </Card>
        <Card>
          <p className="muted">Företag som läst ditt CV</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">{viewerRows.length}</p>
        </Card>
        <Card>
          <p className="muted">Intresseanmälningar</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">{intresseanmalningar}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ProfileForms user={user} />

          {nedladdningar.length > 0 && (
            <Card>
              <h2 className="h2 mb-1">Företag som laddat ner ditt CV</h2>
              <p className="muted mb-4">
                När ett företag skriver ut eller sparar ditt CV lämnar uppgifterna
                plattformen. Därför visas det här.
              </p>
              <ul className="space-y-1 text-sm">
                {nedladdningar.map((n) => (
                  <li key={n.id} className="flex justify-between gap-2">
                    <Link
                      href={`/kandidat/foretag/${n.company.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      {n.company.name}
                    </Link>
                    <span className="text-sand-500">{formatDateTime(n.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <h2 className="h2 mb-1">Företag som har läst ditt CV</h2>
            <p className="muted mb-4">Loggas varje gång ett företag aktivt öppnar din profil.</p>

            {viewerRows.length === 0 ? (
              <Empty>Inget företag har öppnat ditt CV ännu.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-sand-200">
                    <tr>
                      <th className="th">Företag</th>
                      <th className="th">Kommun</th>
                      <th className="th">Antal gånger</th>
                      <th className="th">Senast</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100">
                    {viewerRows.map((r) => (
                      <tr key={r.company!.id}>
                        <td className="td">
                          <Link
                            href={`/kandidat/foretag/${r.company!.id}`}
                            className="font-medium text-brand-600 hover:underline"
                          >
                            {r.company!.name}
                          </Link>
                        </td>
                        <td className="td">{r.company!.municipality}</td>
                        <td className="td">{r.count}</td>
                        <td className="td">{formatDateTime(r.last)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="h2 mb-1">Dölj mig för en e-postdomän</h2>
            <p className="muted mb-4">
              Jobbar du på ett företag du inte vill ska se ditt CV? Blockera deras domän – alla
              konton som registrerats med den adressen ser dig aldrig.
            </p>

            <form action={addHiddenDomain} className="flex gap-2">
              <input name="domain" placeholder="ab.se" className="input" />
              <button className="btn-primary shrink-0" type="submit">
                Blockera
              </button>
            </form>
            <p className="mt-2 text-xs text-sand-500">
              Skriv bara domänen, t.ex. <b>ab.se</b> eller <b>ab.com</b>. Blockera båda om företaget
              använder flera.
            </p>

            {hiddenDomains.length > 0 && (
              <ul className="mt-4 space-y-2">
                {hiddenDomains.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-lg bg-sand-50 px-3 py-2"
                  >
                    <span className="text-sm font-medium">@{d.domain}</span>
                    <form action={removeHiddenDomain}>
                      <input type="hidden" name="id" value={d.id} />
                      <button className="text-sm text-red-600 hover:underline" type="submit">
                        Ta bort
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="h2 mb-1">Notiser</h2>
            <p className="muted mb-4">
              Vi mailar dig när ett företag läst ditt CV – som mest en gång per dygn och företag.
            </p>
            <form action={toggleCvViewNotifications}>
              <button
                className={user.notifyOnCvView ? 'btn-primary w-full' : 'btn-secondary w-full'}
                type="submit"
              >
                {user.notifyOnCvView ? 'Notiser är på – stäng av' : 'Notiser är av – slå på'}
              </button>
            </form>
          </Card>

          <Card>
            <h2 className="h2 mb-3">Dolda företag</h2>
            {hiddenCompanies.length === 0 ? (
              <p className="muted">
                Du är synlig för alla företag. Dölj enskilda företag under fliken{' '}
                <Link href="/kandidat/foretag" className="text-brand-600 hover:underline">
                  Registrerade företag
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-2">
                {hiddenCompanies.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between rounded-lg bg-sand-50 px-3 py-2"
                  >
                    <span className="text-sm font-medium">{h.company.name}</span>
                    <form action={toggleHiddenCompany}>
                      <input type="hidden" name="companyId" value={h.companyId} />
                      <button className="text-sm text-brand-600 hover:underline" type="submit">
                        Visa igen
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="h2 mb-2">Radera konto</h2>
            <p className="muted mb-4">
              Ditt CV och all data raderas permanent. Detta går inte att ångra.
            </p>
            <details>
              <summary className="cursor-pointer text-sm text-red-600">
                Jag vill radera mitt konto
              </summary>
              <form action={deleteAccount} className="mt-3">
                <button className="btn-danger" type="submit">
                  Radera kontot permanent
                </button>
              </form>
            </details>
          </Card>
        </div>
      </div>
    </>
  );
}
