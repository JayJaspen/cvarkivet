import { prisma } from '@/lib/db';
import { requireCompany } from '@/lib/session';
import { planNamn, SUPPORT_EPOST } from '@/lib/data';
import { Card, Notice, PageHeader } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { cancelSubscription } from '@/app/actions/company';
import CompanyForms from './CompanyForms';
import Prenumeration from './Prenumeration';

export const dynamic = 'force-dynamic';

export default async function VarSidaPage({
  searchParams,
}: {
  searchParams: { valkommen?: string };
}) {
  const company = await requireCompany();

  const [views, hearts, ads, history] = await Promise.all([
    prisma.cvView.count({ where: { companyId: company.id } }),
    prisma.heart.count({ where: { companyId: company.id } }),
    prisma.jobAd.count({ where: { companyId: company.id } }),
    prisma.subscriptionEvent.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const blocked = company.blockedUntil && company.blockedUntil > new Date();

  return (
    <>
      <PageHeader title="Vår sida" description="Företagsuppgifter, presentation och prenumeration." />

      {searchParams.valkommen && (
        <Notice tone="green" title="Kontot är skapat!">
          Nästa steg är att vi granskar er registrering. Fyll gärna i presentation och
          logotyp nedan – det gör granskningen snabbare.
        </Notice>
      )}

      {company.status === 'PENDING' && (
        <Notice tone="amber" title="Ert konto granskas">
          Alla företag granskas manuellt innan de får tillgång till CVArkivet. Ni får ett
          mail så snart kontot är godkänt. Fram till dess kan ni fylla i era uppgifter men
          inte söka bland CV, annonsera eller teckna prenumeration.
        </Notice>
      )}

      {company.status === 'REJECTED' && (
        <Notice tone="red" title="Ansökan har fått avslag">
          <p>Vi kunde inte godkänna kontot efter granskning.</p>
          {company.reviewNote && (
            <p className="mt-2">
              <b>Motivering:</b> {company.reviewNote}
            </p>
          )}
          <p className="mt-2">
            Tror ni att det blivit fel? Kontakta {SUPPORT_EPOST}.
          </p>
        </Notice>
      )}

      {company.status === 'APPROVED' && company.subscription === 'NONE' && !searchParams.valkommen && (
        <Notice tone="amber" title="Ingen aktiv prenumeration">
          Kontot är gratis, men tjänsten kräver en prenumeration. Välj ett paket nedan.
        </Notice>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="muted">Öppnade CV</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">{views}</p>
        </Card>
        <Card>
          <p className="muted">Hjärtade kandidater</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">{hearts}</p>
        </Card>
        <Card>
          <p className="muted">Annonser totalt</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">{ads}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CompanyForms company={company} />
        </div>

        <div className="space-y-6">
          <Prenumeration company={company} />

          <Card>
            <p className="text-xs text-slate-500">
              Alla priser anges exklusive moms. Fakturering sker månadsvis av CVArkivet enligt de
              uppgifter ni angett ovan.
            </p>

            {company.subscription !== 'NONE' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-red-600">
                  Säg upp prenumerationen
                </summary>
                <p className="mt-2 text-xs text-slate-500">
                  Observera: efter uppsägning kan ni inte teckna en ny prenumeration förrän efter 2
                  månader.
                </p>
                <form action={cancelSubscription} className="mt-3">
                  <button className="btn-danger w-full" type="submit">
                    Säg upp
                  </button>
                </form>
              </details>
            )}
          </Card>

          {history.length > 0 && (
            <Card>
              <h2 className="h2 mb-3">Prenumerationshistorik</h2>
              <ul className="space-y-2 text-sm">
                {history.map((h) => (
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
