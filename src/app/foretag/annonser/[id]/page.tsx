import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireCompany } from '@/lib/session';
import { arGodkant, harAnnonsAtkomst } from '@/lib/data';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { ageFromBirthDate, formatDate, formatDateTime, kr } from '@/lib/utils';
import Paywall from '@/components/Paywall';
import GranskningNotis from '@/components/GranskningNotis';
import { aiArPakopplad, MATCHSPANN, spannFor } from '@/lib/ai';
import { aiArAvstangt } from '@/lib/ai-kvot';
import { raknaUtMatchningForAnnons } from '@/app/actions/ai';
import AiKnapp from '@/components/AiKnapp';
import { Matchforbehall, Matchplakett } from '@/components/Matchning';
import UppdateraMeny from '@/components/UppdateraMeny';

export const dynamic = 'force-dynamic';

export default async function AnnonsDetalj({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { spann?: string };
}) {
  const company = await requireCompany();

  if (!arGodkant(company))
    return (
      <>
        <PageHeader title="Annonser" />
        <GranskningNotis status={company.status} reviewNote={company.reviewNote} />
      </>
    );

  if (!harAnnonsAtkomst(company))
    return (
      <>
        <PageHeader title="Annonser" />
        <Paywall
          companyType={company.companyType}
          title="Annonsering kräver en aktiv prenumeration"
        />
      </>
    );

  const annons = await prisma.jobAd.findUnique({
    where: { id: params.id },
    include: {
      interests: {
        include: {
          user: {
            include: { categories: true, municipalities: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!annons || annons.companyId !== company.id) notFound();

  // Markera anmälningarna som lästa. Antalet behövs för att veta om
  // sidomenyns räknare måste hämtas om – se UppdateraMeny nedan.
  const { count: markeradeSomLasta } = await prisma.interest.updateMany({
    where: { jobAdId: annons.id, viewedAt: null },
    data: { viewedAt: new Date() },
  });

  const utgangen = annons.deadline < new Date();
  // Poängen räknas bara ut när någon trycker på knappen nedan.
  const aiPa = aiArPakopplad() && !(await aiArAvstangt());

  // Sparade matchningspoäng för kandidaterna som anmält intresse
  const poang = aiPa
    ? await prisma.matchScore.findMany({
        where: { jobAdId: annons.id, userId: { in: annons.interests.map((i) => i.userId) } },
        select: { userId: true, score: true, motivation: true },
      })
    : [];
  const matchningar = new Map(poang.map((p) => [p.userId, p]));

  const valtSpann = searchParams.spann;
  const anmalningar = valtSpann
    ? annons.interests.filter((i) => {
        const m = matchningar.get(i.userId);
        return m ? spannFor(m.score).id === valtSpann : false;
      })
    : annons.interests;

  const antalPerSpann = MATCHSPANN.map((s) => ({
    ...s,
    antal: annons.interests.filter((i) => {
      const m = matchningar.get(i.userId);
      return m ? spannFor(m.score).id === s.id : false;
    }).length,
  }));

  const saknarPoang = annons.interests.filter((i) => !matchningar.has(i.userId)).length;

  return (
    <>
      {/* Notisen i sidomenyn räknas fram när layouten monteras. Har vi just
          markerat anmälningar som lästa måste routen hämtas om, annars ligger
          siffran kvar trots att inget är olästt. */}
      {markeradeSomLasta > 0 && <UppdateraMeny />}

      <Link href="/foretag/annonser" className="muted mb-4 inline-block hover:text-sand-900">
        ← Alla annonser
      </Link>

      <PageHeader
        title={annons.title}
        description={`${annons.category} · ${annons.municipality} · sista ansökningsdag ${formatDate(annons.deadline)}`}
      />

      {utgangen && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Annonsen har gått ut och visas inte längre för kandidaterna. Intresseanmälningarna
          ligger kvar här.
        </div>
      )}

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="h2">
            {annons.interests.length}{' '}
            {annons.interests.length === 1 ? 'intresseanmälan' : 'intresseanmälningar'}
          </h2>
          {(annons.salaryMin || annons.salaryMax) && (
            <Badge>
              {kr(annons.salaryMin)} – {kr(annons.salaryMax)}
            </Badge>
          )}
        </div>

        {aiPa && annons.interests.length > 0 && (
          <div className="mb-5 rounded-xl border border-sand-200 bg-sand-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-sand-900">Filtrera på matchning</p>
              {saknarPoang > 0 && (
                <AiKnapp
                  action={raknaUtMatchningForAnnons}
                  jobAdId={annons.id}
                  etikett={`Räkna ut matchning för ${saknarPoang} ${saknarPoang === 1 ? 'kandidat' : 'kandidater'}`}
                  arbetar="Räknar…"
                  className="btn-secondary"
                />
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/foretag/annonser/${annons.id}`}
                className={!valtSpann ? 'btn-primary' : 'btn-secondary'}
              >
                Alla ({annons.interests.length})
              </Link>
              {antalPerSpann.map((s) => (
                <Link
                  key={s.id}
                  href={`/foretag/annonser/${annons.id}?spann=${s.id}`}
                  className={valtSpann === s.id ? 'btn-primary' : 'btn-secondary'}
                >
                  {s.namn} ({s.antal})
                </Link>
              ))}
            </div>

            <Matchforbehall className="mt-3" />
          </div>
        )}

        {anmalningar.length === 0 && annons.interests.length > 0 ? (
          <Empty>Ingen kandidat i det här matchningsspannet.</Empty>
        ) : annons.interests.length === 0 ? (
          <Empty>
            Ingen har anmält intresse ännu. Kandidater som klickar &quot;Visa intresse&quot; på
            annonsen dyker upp här, och ni kan då kontakta dem direkt.
          </Empty>
        ) : (
          <div className="space-y-4">
            {anmalningar.map((i) => {
              const k = i.user;
              const alder = ageFromBirthDate(k.birthDate);
              const match = matchningar.get(k.id);

              return (
                <div key={i.id} className="rounded-xl border border-sand-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      {k.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={k.photoUrl}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-full border border-sand-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sand-100 text-sm font-semibold text-sand-400">
                          {k.firstName.slice(0, 1)}
                          {k.lastName.slice(0, 1)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <Link
                          href={`/foretag/cvarkivet/${k.id}`}
                          className="font-semibold text-brand-600 hover:underline"
                        >
                          {k.firstName} {k.lastName}
                        </Link>
                        <p className="muted">
                          {k.headline || 'Ingen yrkesrubrik'}
                          {alder !== null && ` · ${alder} år`}
                          {k.homeMunicipality && ` · ${k.homeMunicipality}`}
                        </p>
                        {k.seeking && (
                          <p className="text-sm font-medium text-brand-700">Söker: {k.seeking}</p>
                        )}
                        {match && (
                          <p className="mt-2 rounded-lg bg-sand-50 p-2 text-sm text-sand-800">
                            {match.motivation}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {k.activelyLooking ? (
                            <Badge tone="green">Söker aktivt</Badge>
                          ) : (
                            <Badge>Passiv</Badge>
                          )}
                          {k.salaryExpectation && <Badge>{kr(k.salaryExpectation)}/mån</Badge>}
                          {k.categories.slice(0, 2).map((c) => (
                            <Badge key={c.id} tone="blue">
                              {c.category}
                            </Badge>
                          ))}
                        </div>

                        {i.message && (
                          <p className="mt-3 rounded-lg bg-sand-50 p-3 text-sm italic text-sand-800">
                            &quot;{i.message}&quot;
                          </p>
                        )}

                        <p className="muted mt-2">Anmälde intresse {formatDateTime(i.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {match && <Matchplakett score={match.score} />}
                      <Link href={`/foretag/cvarkivet/${k.id}`} className="btn-primary">
                        Öppna CV
                      </Link>
                      <Link href={`/foretag/meddelanden?kandidat=${k.id}`} className="btn-secondary">
                        Skicka meddelande
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
