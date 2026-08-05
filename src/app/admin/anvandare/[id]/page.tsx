import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { ageFromBirthDate, formatDate, formatDateTime, kr } from '@/lib/utils';
import { toggleUserSuspended } from '@/app/actions/admin';

export const dynamic = 'force-dynamic';

export default async function AdminUserDetail({ params }: { params: { id: string } }) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      categories: true,
      municipalities: true,
      experiences: { orderBy: { fromDate: 'desc' } },
      educations: { orderBy: { fromDate: 'desc' } },
      hiddenDomains: true,
      hiddenCompanies: { include: { company: { select: { name: true } } } },
      favorites: { include: { company: { select: { name: true } } } },
    },
  });
  if (!user) notFound();

  const [visits, views] = await Promise.all([
    prisma.companyVisit.findMany({
      where: { userId: user.id },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.cvView.findMany({
      where: { userId: user.id },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  return (
    <>
      <Link href="/admin/anvandare" className="muted mb-4 inline-block hover:text-slate-900">
        ← Alla användare
      </Link>

      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description={`${user.email} · ${user.phone}`}
        action={
          <form action={toggleUserSuspended}>
            <input type="hidden" name="id" value={user.id} />
            <button className={user.suspended ? 'btn-secondary' : 'btn-danger'} type="submit">
              {user.suspended ? 'Aktivera kontot' : 'Stäng av kontot'}
            </button>
          </form>
        }
      />

      {user.suspended && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          Kontot är avstängt och användaren kan inte logga in.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="h2 mb-3">CV</h2>
            {user.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoUrl}
                alt=""
                className="mb-3 h-20 w-20 rounded-full border border-slate-200 object-cover"
              />
            )}
            <p className="font-medium">{user.headline || 'Ingen yrkesrubrik'}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {user.summary || 'Ingen presentation.'}
            </p>
            <h3 className="mt-5 text-sm font-semibold text-slate-700">Personligt brev</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
              {user.coverLetter || 'Inget personligt brev.'}
            </p>

            <h3 className="mt-5 text-sm font-semibold text-slate-700">Arbetslivserfarenhet</h3>
            {user.experiences.length === 0 ? (
              <p className="muted">–</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {user.experiences.map((e) => (
                  <li key={e.id}>
                    <b>{e.title}</b> · {e.employer} ({e.fromDate} – {e.toDate || 'pågående'})
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mt-5 text-sm font-semibold text-slate-700">Utbildning</h3>
            {user.educations.length === 0 ? (
              <p className="muted">–</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {user.educations.map((e) => (
                  <li key={e.id}>
                    <b>{e.program}</b> · {e.school} ({e.fromDate} – {e.toDate || 'pågående'})
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="h2 mb-1">Besökta företagsprofiler</h2>
            <p className="muted mb-4">{visits.length} besök (senaste 100).</p>
            {visits.length === 0 ? (
              <Empty>Inga besök loggade.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="th">Företag</th>
                      <th className="th">Tidpunkt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visits.map((v) => (
                      <tr key={v.id}>
                        <td className="td">
                          <Link
                            href={`/admin/foretag/${v.company.id}`}
                            className="text-brand-600 hover:underline"
                          >
                            {v.company.name}
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

          <Card>
            <h2 className="h2 mb-1">Företag som läst CV:t</h2>
            <p className="muted mb-4">{views.length} visningar (senaste 100).</p>
            {views.length === 0 ? (
              <Empty>Inga visningar loggade.</Empty>
            ) : (
              <ul className="space-y-1 text-sm">
                {views.map((v) => (
                  <li key={v.id} className="flex justify-between">
                    <Link
                      href={`/admin/foretag/${v.company.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      {v.company.name}
                    </Link>
                    <span className="text-slate-500">{formatDateTime(v.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="h2 mb-3">Kontouppgifter</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Ålder</dt>
                <dd>{ageFromBirthDate(user.birthDate) ?? '–'} år</dd>
              </div>
              <div>
                <dt className="text-slate-500">Registrerad</dt>
                <dd>{formatDate(user.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Senaste inloggning</dt>
                <dd>{formatDateTime(user.lastLoginAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Hemkommun</dt>
                <dd>{user.homeMunicipality || '–'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Löneanspråk</dt>
                <dd>{user.salaryExpectation ? kr(user.salaryExpectation) : '–'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Söker aktivt</dt>
                <dd>{user.activelyLooking ? 'Ja' : 'Nej'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Kategorier</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {user.categories.map((c) => (
                    <Badge key={c.id} tone="blue">
                      {c.category}
                    </Badge>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Kommuner</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {user.municipalities.map((m) => (
                    <Badge key={m.id}>{m.municipality}</Badge>
                  ))}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="h2 mb-3">Integritetsval</h2>
            <p className="text-sm font-medium text-slate-700">Blockerade domäner</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {user.hiddenDomains.length === 0 && <span className="muted">Inga</span>}
              {user.hiddenDomains.map((d) => (
                <Badge key={d.id} tone="red">
                  @{d.domain}
                </Badge>
              ))}
            </div>

            <p className="mt-4 text-sm font-medium text-slate-700">Dolda företag</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {user.hiddenCompanies.length === 0 && <span className="muted">Inga</span>}
              {user.hiddenCompanies.map((h) => (
                <Badge key={h.id} tone="red">
                  {h.company.name}
                </Badge>
              ))}
            </div>

            <p className="mt-4 text-sm font-medium text-slate-700">Favoritföretag</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {user.favorites.length === 0 && <span className="muted">Inga</span>}
              {user.favorites.map((f) => (
                <Badge key={f.id} tone="pink">
                  {f.company.name}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
