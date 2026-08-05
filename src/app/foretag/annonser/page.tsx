import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireCompany } from '@/lib/session';
import { arGodkant, harAnnonsAtkomst } from '@/lib/data';
import GranskningNotis from '@/components/GranskningNotis';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDate, kr } from '@/lib/utils';
import Paywall from '@/components/Paywall';
import { deleteJobAd } from '@/app/actions/company';
import AdForm from './AdForm';

export const dynamic = 'force-dynamic';

export default async function AnnonserPage() {
  const company = await requireCompany();

  if (!arGodkant(company)) {
    return (
      <>
        <PageHeader title="Annonser" />
        <GranskningNotis status={company.status} reviewNote={company.reviewNote} />
      </>
    );
  }

  if (!harAnnonsAtkomst(company)) {
    return (
      <>
        <PageHeader title="Annonser" />
        <Paywall
          companyType={company.companyType}
          title="Annonsering kräver en aktiv prenumeration"
        />
      </>
    );
  }

  const ads = await prisma.jobAd.findMany({
    where: { companyId: company.id },
    include: { _count: { select: { interests: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();

  return (
    <>
      <PageHeader
        title="Annonser"
        description="Utgångna annonser tas bort för kandidaterna men ligger kvar här tills ni raderar dem."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {ads.length === 0 ? (
            <Empty>Ni har inga annonser ännu. Skapa den första till höger.</Empty>
          ) : (
            <div className="space-y-4">
              {ads.map((a) => {
                const expired = a.deadline < now;
                return (
                  <Card key={a.id} className={expired ? 'opacity-70' : ''}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold">{a.title}</h2>
                          {expired ? (
                            <Badge tone="red">Utgången</Badge>
                          ) : (
                            <Badge tone="green">Publicerad</Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge tone="blue">{a.category}</Badge>
                          <Badge>{a.municipality}</Badge>
                          {(a.salaryMin || a.salaryMax) && (
                            <Badge>
                              {kr(a.salaryMin)} – {kr(a.salaryMax)}
                            </Badge>
                          )}
                          <Badge tone="amber">Sista dag {formatDate(a.deadline)}</Badge>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{a.body}</p>
                        <p className="muted mt-2">
                          Ansökan: {a.applyEmail ?? ''} {a.applyUrl ?? ''}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Link
                          href={`/foretag/annonser/${a.id}`}
                          className={a._count.interests > 0 ? 'btn-primary' : 'btn-secondary'}
                        >
                          {a._count.interests === 0
                            ? 'Inga intresseanmälningar'
                            : `${a._count.interests} ${
                                a._count.interests === 1
                                  ? 'intresseanmälan'
                                  : 'intresseanmälningar'
                              }`}
                        </Link>
                        <form action={deleteJobAd}>
                          <input type="hidden" name="id" value={a.id} />
                          <button className="btn-danger" type="submit">
                            Radera
                          </button>
                        </form>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <AdForm />
        </div>
      </div>
    </>
  );
}
