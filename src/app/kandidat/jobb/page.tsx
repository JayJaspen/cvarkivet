import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { KATEGORIER, KOMMUNER_MED_DISTANS } from '@/lib/data';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDate, kr } from '@/lib/utils';
import { contains } from '@/lib/search';
import IntresseKnapp from './IntresseKnapp';
import { aiArPakopplad } from '@/lib/ai';
import { aiArAvstangt } from '@/lib/ai-kvot';
import { raknaUtMatchning } from '@/app/actions/ai';
import AiKnapp from '@/components/AiKnapp';
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
  // Matchning räknas aldrig ut av sig självt – knappen visas bara, och bara
  // så länge AI är påslaget och admin inte dragit i nödstoppet.
  const aiPa = aiArPakopplad() && !(await aiArAvstangt());

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
        /* Hopfällda rader. Listan ska gå att skumma – annonstexten varierar
           från två rader till två skärmar, och drunknade allt annat. Byggt med
           <details> så att det fungerar utan JavaScript och utan att sidan
           behöver bli en klientkomponent. */
        <div className="space-y-3">
          {jobs.map((j) => {
            const match = matchningar.get(j.id);

            return (
              <details
                key={j.id}
                className="group overflow-hidden rounded-xl border border-sand-200 bg-white shadow-card"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 p-4 hover:bg-sand-50 [&::-webkit-details-marker]:hidden">
                  {j.company.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={j.company.logoUrl}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-lg border border-sand-200 object-contain p-1"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-xs font-bold text-sand-500">
                      {j.company.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h2 className="font-semibold text-sand-900">{j.title}</h2>
                      {anmalt.has(j.id) && <Badge tone="green">Intresse anmält</Badge>}
                      {match && <Matchplakett score={match.score} storlek="liten" />}
                    </div>

                    <p className="mt-0.5 truncate text-sm text-sand-600">
                      {j.company.name} · {j.municipality}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="blue">{j.category}</Badge>
                      {(j.salaryMin || j.salaryMax) && (
                        <Badge>
                          {j.salaryMin ? kr(j.salaryMin) : '?'} –{' '}
                          {j.salaryMax ? kr(j.salaryMax) : '?'}
                        </Badge>
                      )}
                      <Badge tone="amber">Sista dag {formatDate(j.deadline)}</Badge>
                    </div>
                  </div>

                  <span
                    aria-hidden
                    className="shrink-0 self-start text-sand-400 transition-transform group-open:rotate-180"
                  >
                    ▾
                  </span>
                </summary>

                <div className="border-t border-sand-200 p-4">
                  <p className="whitespace-pre-wrap text-sm text-sand-800">{j.body}</p>

                  {match && (
                    <div className="mt-4 rounded-lg border border-sand-200 bg-sand-50 p-3">
                      <p className="text-sm text-sand-800">
                        <b>Du matchar {match.score}% med den här annonsen.</b> {match.motivation}
                      </p>
                      <Matchforbehall className="mt-2" />
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-start gap-2">
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

                    {aiPa && !match && (
                      <AiKnapp
                        action={raknaUtMatchning}
                        jobAdId={j.id}
                        etikett="Räkna ut min matchning"
                        arbetar="Räknar…"
                        className="btn-secondary"
                      />
                    )}

                    <Link
                      href={`/kandidat/foretag/${j.company.id}`}
                      className="btn-secondary"
                    >
                      Om {j.company.name}
                    </Link>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </>
  );
}
