import { requireCompany } from '@/lib/session';
import { hamtaTopplista } from '@/lib/topplista';
import Topplista from '@/components/Topplista';
import { Card, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ForetagTopplista() {
  const company = await requireCompany();
  const platser = await hamtaTopplista();

  const egenPlats = platser.find((p) => p.id === company.id);

  return (
    <>
      <PageHeader
        title="Mest följda företag"
        description="De 50 företag som flest kandidater följer på CVArkivet."
      />

      <Card className="mb-6">
        {egenPlats ? (
          <p className="text-sm">
            <b>{company.name}</b> ligger på plats <b>{egenPlats.plats}</b> med{' '}
            <b>{egenPlats.foljare}</b> {egenPlats.foljare === 1 ? 'följare' : 'följare'}.
          </p>
        ) : (
          <p className="text-sm">
            <b>{company.name}</b> finns ännu inte på listan. Kandidater följer er genom att
            markera er som favoritföretag. En ifylld presentation och aktiva annonser gör att
            fler hittar er.
          </p>
        )}
      </Card>

      <Topplista platser={platser} />
    </>
  );
}
