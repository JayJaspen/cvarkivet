import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { Badge, Card, PageHeader, Notice } from '@/components/ui';
import { formatDate, kr } from '@/lib/utils';
import { toggleFavorite, toggleHiddenCompany } from '@/app/actions/user';

export const dynamic = 'force-dynamic';

export default async function CompanyProfile({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      jobAds: { where: { deadline: { gte: new Date() } }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!company || company.suspended || company.status !== 'APPROVED') notFound();

  // Logga besöket (admin kan se vilka företagsprofiler en användare besökt)
  await prisma.companyVisit.create({ data: { userId: user.id, companyId: company.id } });

  const [fav, hidden] = await Promise.all([
    prisma.favorite.findUnique({
      where: { userId_companyId: { userId: user.id, companyId: company.id } },
    }),
    prisma.hiddenCompany.findUnique({
      where: { userId_companyId: { userId: user.id, companyId: company.id } },
    }),
  ]);

  return (
    <>
      <Link href="/kandidat/foretag" className="muted mb-4 inline-block hover:text-slate-900">
        ← Alla företag
      </Link>

      <PageHeader title={company.name} description={`${company.municipality}`} />

      {hidden && (
        <Notice tone="amber" title="Din profil är dold för det här företaget">
          De kan inte se ditt CV i CVArkivet.
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex items-start gap-4">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-20 w-20 rounded-xl border border-slate-200 object-contain"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 text-xl font-bold text-slate-500">
                  {company.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="h2">Om företaget</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                  {company.presentation || 'Företaget har inte lagt in någon presentation ännu.'}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="h2 mb-4">Lediga jobb hos {company.name}</h2>
            {company.jobAds.length === 0 ? (
              <p className="muted">Inga aktiva annonser just nu.</p>
            ) : (
              <div className="space-y-3">
                {company.jobAds.map((j) => (
                  <div key={j.id} className="rounded-lg border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">{j.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge tone="blue">{j.category}</Badge>
                      <Badge>{j.municipality}</Badge>
                      {(j.salaryMin || j.salaryMax) && (
                        <Badge>
                          {kr(j.salaryMin)} – {kr(j.salaryMax)}
                        </Badge>
                      )}
                      <Badge tone="amber">Sista dag {formatDate(j.deadline)}</Badge>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{j.body}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="h2 mb-3">Dina val</h2>
            <div className="space-y-2">
              <form action={toggleFavorite}>
                <input type="hidden" name="companyId" value={company.id} />
                <button className={`${fav ? 'btn-primary' : 'btn-secondary'} w-full`} type="submit">
                  {fav ? '★ Favoritföretag' : '☆ Gör till favoritföretag'}
                </button>
              </form>
              <form action={toggleHiddenCompany}>
                <input type="hidden" name="companyId" value={company.id} />
                <button
                  className={`${hidden ? 'btn-danger' : 'btn-secondary'} w-full`}
                  type="submit"
                >
                  {hidden ? 'Visa min profil igen' : 'Dölj min profil för dem'}
                </button>
              </form>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Favoriter visas för företaget i CVArkivet – ett bra sätt att signalera intresse.
            </p>
          </Card>

          <Card>
            <h2 className="h2 mb-3">Kontaktuppgifter</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Adress</dt>
                <dd>{company.address}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Kommun</dt>
                <dd>{company.municipality}</dd>
              </div>
              {company.website && (
                <div>
                  <dt className="text-slate-500">Webbplats</dt>
                  <dd>
                    <a
                      href={`https://${company.website}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-brand-600 hover:underline"
                    >
                      {company.website}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
