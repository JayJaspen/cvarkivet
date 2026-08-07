import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { Badge, Card, PageHeader } from '@/components/ui';
import { visaPublikStatistik } from '@/lib/installningar';
import { vaxlaPublikStatistik } from '@/app/actions/admin';

export const dynamic = 'force-dynamic';

export default async function Installningar() {
  await requireAdmin();

  const [pa, kandidater, foretag, annonser] = await Promise.all([
    visaPublikStatistik(),
    prisma.user.count({ where: { suspended: false } }),
    prisma.company.count({ where: { suspended: false, status: 'APPROVED' } }),
    prisma.jobAd.count({
      where: {
        deadline: { gte: new Date() },
        company: { suspended: false, status: 'APPROVED' },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Inställningar"
        description="Reglage som styr sajten i drift, utan att något behöver läggas upp på nytt."
      />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="h2 mb-1">Publik statistik på startsidan</h2>
            <p className="muted max-w-2xl">
              Rutorna med antal kandidater, anslutna företag och aktiva annonser. En
              marknadsplats med få registrerade ser tommare ut än den är, så siffrorna gör
              mer skada än nytta i början. Slå på dem när de börjar imponera.
            </p>
            <p className="muted mt-2 max-w-2xl">
              Påverkar även smakprovet för företag utan abonnemang, som annars skriver ut
              hur många kandidater arkivet innehåller.
            </p>
          </div>

          <form action={vaxlaPublikStatistik} className="shrink-0">
            <input type="hidden" name="pa" value={pa ? 'nej' : 'ja'} />
            <button className={pa ? 'btn-secondary' : 'btn-primary'} type="submit">
              {pa ? 'Dölj siffrorna' : 'Visa siffrorna'}
            </button>
          </form>
        </div>

        <p className="mt-4">
          {pa ? (
            <Badge tone="green">Siffrorna visas publikt</Badge>
          ) : (
            <Badge tone="amber">Siffrorna är dolda</Badge>
          )}
        </p>

        <div className="mt-5 rounded-lg border border-sand-200 bg-sand-50 p-4">
          <p className="text-sm font-medium text-sand-900">
            Så här skulle rutorna se ut just nu
          </p>
          <dl className="mt-3 grid max-w-lg grid-cols-3 gap-3">
            {[
              { n: kandidater, l: 'Registrerade kandidater' },
              { n: foretag, l: 'Anslutna företag' },
              { n: annonser, l: 'Aktiva annonser' },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-sand-200 bg-white p-3">
                <dt className="text-2xl font-bold text-brand-600">{s.n}</dt>
                <dd className="mt-1 text-xs text-sand-500">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>
    </>
  );
}
