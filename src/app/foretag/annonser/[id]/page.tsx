import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireCompany } from '@/lib/session';
import { arGodkant, harAnnonsAtkomst } from '@/lib/data';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { ageFromBirthDate, formatDate, formatDateTime, kr } from '@/lib/utils';
import Paywall from '@/components/Paywall';
import GranskningNotis from '@/components/GranskningNotis';

export const dynamic = 'force-dynamic';

export default async function AnnonsDetalj({ params }: { params: { id: string } }) {
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
        <Paywall need="CV_ADS" title="Annonsering ingår i CV + Annonspaket" />
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

  // Markera anmälningarna som lästa
  await prisma.interest.updateMany({
    where: { jobAdId: annons.id, viewedAt: null },
    data: { viewedAt: new Date() },
  });

  const utgangen = annons.deadline < new Date();

  return (
    <>
      <Link href="/foretag/annonser" className="muted mb-4 inline-block hover:text-slate-900">
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

        {annons.interests.length === 0 ? (
          <Empty>
            Ingen har anmält intresse ännu. Kandidater som klickar &quot;Visa intresse&quot; på
            annonsen dyker upp här, och ni kan då kontakta dem direkt.
          </Empty>
        ) : (
          <div className="space-y-4">
            {annons.interests.map((i) => {
              const k = i.user;
              const alder = ageFromBirthDate(k.birthDate);

              return (
                <div key={i.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      {k.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={k.photoUrl}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-400">
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
                          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm italic text-slate-700">
                            &quot;{i.message}&quot;
                          </p>
                        )}

                        <p className="muted mt-2">Anmälde intresse {formatDateTime(i.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
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
