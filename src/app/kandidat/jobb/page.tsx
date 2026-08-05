import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { KATEGORIER, KOMMUNER_MED_DISTANS } from '@/lib/data';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDate, kr } from '@/lib/utils';
import { contains } from '@/lib/search';
import { applyToJob } from '@/app/actions/user';

export const dynamic = 'force-dynamic';

export default async function JobbPage({
  searchParams,
}: {
  searchParams: { kommun?: string; kategori?: string; foretag?: string };
}) {
  const user = await requireUser();
  const { kommun, kategori, foretag } = searchParams;

  const jobs = await prisma.jobAd.findMany({
    where: {
      deadline: { gte: new Date() }, // utgångna annonser försvinner för kandidater
      company: { suspended: false, status: 'APPROVED' },
      ...(kommun ? { municipality: kommun } : {}),
      ...(kategori ? { category: kategori } : {}),
      ...(foretag
        ? { company: { name: contains(foretag), suspended: false, status: 'APPROVED' } }
        : {}),
    },
    include: { company: { select: { id: true, name: true, logoUrl: true, municipality: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const myApplications = await prisma.application.findMany({
    where: { userId: user.id },
    select: { jobAdId: true },
  });
  const applied = new Set(myApplications.map((a) => a.jobAdId));

  return (
    <>
      <PageHeader
        title="Lediga jobb"
        description="Annonser publicerade av företagen på CVArkivet. Utgångna annonser tas bort automatiskt."
      />

      <Card className="mb-6">
        <form className="grid gap-3 sm:grid-cols-4">
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
            <label className="label">Sök företag</label>
            <input
              name="foretag"
              defaultValue={foretag ?? ''}
              placeholder="Företagsnamn"
              className="input"
            />
          </div>
          <div className="flex items-end gap-2">
            <button className="btn-primary flex-1" type="submit">
              Filtrera
            </button>
            <Link href="/kandidat/jobb" className="btn-secondary">
              Rensa
            </Link>
          </div>
        </form>
      </Card>

      <p className="muted mb-3">
        {jobs.length} {jobs.length === 1 ? 'annons' : 'annonser'}
      </p>

      {jobs.length === 0 ? (
        <Empty>Inga annonser matchar din sökning just nu.</Empty>
      ) : (
        <div className="space-y-4">
          {jobs.map((j) => (
            <Card key={j.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{j.title}</h2>
                    {applied.has(j.id) && <Badge tone="green">Ansökt</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    <Link
                      href={`/kandidat/foretag/${j.company.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {j.company.name}
                    </Link>{' '}
                    · {j.municipality}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="blue">{j.category}</Badge>
                    {(j.salaryMin || j.salaryMax) && (
                      <Badge>
                        {j.salaryMin ? kr(j.salaryMin) : '?'} – {j.salaryMax ? kr(j.salaryMax) : '?'}
                      </Badge>
                    )}
                    <Badge tone="amber">Sista ansökningsdag {formatDate(j.deadline)}</Badge>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{j.body}</p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-48">
                  {j.applyUrl && (
                    <a
                      href={j.applyUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn-primary"
                    >
                      Ansök via länk
                    </a>
                  )}
                  {j.applyEmail && (
                    <a href={`mailto:${j.applyEmail}?subject=Ansökan: ${encodeURIComponent(j.title)}`} className="btn-secondary">
                      Ansök via e-post
                    </a>
                  )}
                  <form action={applyToJob}>
                    <input type="hidden" name="jobAdId" value={j.id} />
                    <button
                      className="btn-secondary w-full"
                      type="submit"
                      disabled={applied.has(j.id)}
                    >
                      {applied.has(j.id) ? 'Markerad som ansökt' : 'Markera som ansökt'}
                    </button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
