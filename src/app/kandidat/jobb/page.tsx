import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { KATEGORIER, KOMMUNER_MED_DISTANS } from '@/lib/data';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDate, kr } from '@/lib/utils';
import { contains } from '@/lib/search';
import IntresseKnapp from './IntresseKnapp';
import { aiArPakopplad } from '@/lib/ai';
import { raknaUtMatchning } from '@/app/actions/ai';
import { Matchforbehall, Matchplakett } from '@/components/Matchning';

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
    include: {
      company: { select: { id: true, name: true, logoUrl: true, municipality: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const [mittIntresse, doldaForetag, poang] = await Promise.all([
    prisma.interest.findMany({ where: { userId: user.id }, select: { jobAdId: true } }),
    prisma.hiddenCompany.findMany({ where: { userId: user.id }, select: { companyId: true } }),
    prisma.matchScore.findMany({
      where: { userId: user.id },
      select: { jobAdId: true, score: true, motivation: true },
    }),
  ]);
  const anmalt = new Set(mittIntresse.map((i) => i.jobAdId));
  const dolda = new Set(doldaForetag.map((h) => h.companyId));
  const matchningar = new Map(poang.map((p) => [p.jobAdId, p]));
  const aiPa = aiArPakopplad();

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
                <div className="flex min-w-0 flex-1 gap-4">
                  {j.company.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={j.company.logoUrl}
                      alt={j.company.name}
                      className="h-14 w-14 shrink-0 rounded-lg border border-sand-200 object-contain p-1"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-sm font-bold text-sand-500">
                      {j.company.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-sand-900">{j.title}</h2>
                      {anmalt.has(j.id) && <Badge tone="green">Intresse anmält</Badge>}
                      {matchningar.has(j.id) && (
                        <Matchplakett score={matchningar.get(j.id)!.score} storlek="liten" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-sand-600">
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
                          {j.salaryMin ? kr(j.salaryMin) : '?'} –{' '}
                          {j.salaryMax ? kr(j.salaryMax) : '?'}
                        </Badge>
                      )}
                      <Badge tone="amber">Sista ansökningsdag {formatDate(j.deadline)}</Badge>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-sand-800">{j.body}</p>

                    {matchningar.has(j.id) && (
                      <div className="mt-3 rounded-lg border border-sand-200 bg-sand-50 p-3">
                        <p className="text-sm text-sand-800">
                          <b>Du matchar {matchningar.get(j.id)!.score}% med den här annonsen.</b>{' '}
                          {matchningar.get(j.id)!.motivation}
                        </p>
                        <Matchforbehall className="mt-2" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-56">
                  {aiPa && !matchningar.has(j.id) && (
                    <form action={raknaUtMatchning}>
                      <input type="hidden" name="jobAdId" value={j.id} />
                      <button className="btn-secondary w-full" type="submit">
                        Räkna ut min matchning
                      </button>
                    </form>
                  )}

                  <IntresseKnapp
                    jobAdId={j.id}
                    foretagsnamn={j.company.name}
                    anmalt={anmalt.has(j.id)}
                    dold={dolda.has(j.company.id)}
                  />

                  {j.applyUrl && (
                    <a
                      href={j.applyUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn-secondary"
                    >
                      Ansök via länk
                    </a>
                  )}
                  {j.applyEmail && (
                    <a
                      href={`mailto:${j.applyEmail}?subject=Ansökan: ${encodeURIComponent(j.title)}`}
                      className="btn-secondary"
                    >
                      Ansök via e-post
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
