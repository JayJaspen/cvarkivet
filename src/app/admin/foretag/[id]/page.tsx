import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { planNamn } from '@/lib/data';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDate, formatDateTime, kr } from '@/lib/utils';
import { clearCompanyBlock, toggleCompanySuspended } from '@/app/actions/admin';

export const dynamic = 'force-dynamic';

export default async function AdminCompanyDetail({ params }: { params: { id: string } }) {
  await requireAdmin();

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      jobAds: { orderBy: { createdAt: 'desc' } },
      subscriptionLog: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!company) notFound();

  const views = await prisma.cvView.findMany({
    where: { companyId: company.id },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const blocked = company.blockedUntil && company.blockedUntil > new Date();

  return (
    <>
      <Link href="/admin/foretag" className="muted mb-4 inline-block hover:text-slate-900">
        ← Alla företag
      </Link>

      <PageHeader
        title={company.name}
        description={`${company.orgNumber} · ${company.municipality}`}
        action={
          <form action={toggleCompanySuspended}>
            <input type="hidden" name="id" value={company.id} />
            <button className={company.suspended ? 'btn-secondary' : 'btn-danger'} type="submit">
              {company.suspended ? 'Aktivera kontot' : 'Stäng av kontot'}
            </button>
          </form>
        }
      />

      {company.suspended && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          Kontot är avstängt och företaget kan inte logga in.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="h2 mb-1">Annonser</h2>
            <p className="muted mb-4">{company.jobAds.length} totalt.</p>
            {company.jobAds.length === 0 ? (
              <Empty>Inga annonser.</Empty>
            ) : (
              <div className="space-y-3">
                {company.jobAds.map((a) => (
                  <div key={a.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{a.title}</p>
                      {a.deadline < new Date() ? (
                        <Badge tone="red">Utgången</Badge>
                      ) : (
                        <Badge tone="green">Aktiv</Badge>
                      )}
                    </div>
                    <p className="muted mt-1">
                      {a.category} · {a.municipality} · sista dag {formatDate(a.deadline)} ·{' '}
                      {kr(a.salaryMin)}–{kr(a.salaryMax)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{a.body}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="h2 mb-1">Lästa CV</h2>
            <p className="muted mb-4">{views.length} visningar (senaste 200).</p>
            {views.length === 0 ? (
              <Empty>Företaget har inte öppnat något CV.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="th">Kandidat</th>
                      <th className="th">Tidpunkt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {views.map((v) => (
                      <tr key={v.id}>
                        <td className="td">
                          <Link
                            href={`/admin/anvandare/${v.user.id}`}
                            className="text-brand-600 hover:underline"
                          >
                            {v.user.firstName} {v.user.lastName}
                          </Link>
                        </td>
                        <td className="td">{formatDateTime(v.createdAt)}</td>
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
            <h2 className="h2 mb-3">Faktureringsunderlag</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Prenumeration</dt>
                <dd className="font-medium">{planNamn(company.subscription)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Startdatum</dt>
                <dd>{formatDate(company.subscriptionStarted)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Uppsagd</dt>
                <dd>{formatDate(company.cancelledAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Organisationsnummer</dt>
                <dd>{company.orgNumber}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Fakturaadress</dt>
                <dd>{company.address}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Kontaktperson</dt>
                <dd>
                  {company.contactName}
                  <br />
                  {company.email}
                  <br />
                  {company.phone}
                </dd>
              </div>
            </dl>

            {blocked && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p>
                  Karens till <b>{formatDate(company.blockedUntil)}</b> – företaget kan inte teckna
                  ny prenumeration.
                </p>
                <form action={clearCompanyBlock} className="mt-2">
                  <input type="hidden" name="id" value={company.id} />
                  <button className="btn-secondary" type="submit">
                    Häv karensen
                  </button>
                </form>
              </div>
            )}
          </Card>

          {company.subscriptionLog.length > 0 && (
            <Card>
              <h2 className="h2 mb-3">Prenumerationshistorik</h2>
              <ul className="space-y-2 text-sm">
                {company.subscriptionLog.map((h) => (
                  <li key={h.id} className="flex justify-between gap-2">
                    <span>
                      {h.type === 'ACTIVATED'
                        ? 'Aktiverade'
                        : h.type === 'CHANGED'
                          ? 'Bytte till'
                          : 'Sade upp'}{' '}
                      {planNamn(h.plan)}
                    </span>
                    <span className="text-slate-500">{formatDate(h.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
