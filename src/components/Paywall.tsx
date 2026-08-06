import Link from 'next/link';
import { Card } from './ui';
import { bolagstypText, manadskostnad, pris, prisInklMoms } from '@/lib/data';

const kr = (n: number) => n.toLocaleString('sv-SE');

export default function Paywall({
  companyType = 'EMPLOYER',
  title = 'Aktivera ert abonnemang för att komma åt tjänsten',
  kompakt = false,
}: {
  companyType?: string;
  title?: string;
  /** Smalare variant, för när den ligger under en förhandsvisning. */
  kompakt?: boolean;
}) {
  const belopp = pris(companyType);

  return (
    <Card className={kompakt ? '' : 'mx-auto max-w-2xl text-center'}>
      <h2 className="h2">{title}</h2>
      <p className={`muted mt-2 max-w-md ${kompakt ? '' : 'mx-auto'}`}>
        Kontot är gratis. För att söka i hela CV-arkivet, kontakta kandidater och publicera
        annonser aktiverar ni abonnemanget under fliken <b>Vår sida</b>.
      </p>

      <div
        className={`mt-6 rounded-xl border border-brand-300 bg-brand-50 p-5 text-left ${
          kompakt ? '' : 'mx-auto max-w-sm'
        }`}
      >
        <p className="font-semibold">Årsabonnemang</p>
        <p className="mt-1 text-3xl font-bold text-brand-600">
          {kr(belopp)} kr
          <span className="text-sm font-normal text-sand-500">/år exkl. moms</span>
        </p>
        <p className="text-xs text-sand-500">
          {kr(prisInklMoms(belopp))} kr inkl. moms · motsvarar {kr(manadskostnad(companyType))}{' '}
          kr/mån
        </p>
        <p className="muted mt-3">
          Allt ingår: hela CV-arkivet, obegränsat antal annonser och direktkontakt med
          kandidaterna. Gäller ett år från den dag ni aktiverar.
        </p>
      </div>

      <p className="muted mt-4">Priset gäller {bolagstypText(companyType).toLowerCase()}.</p>

      <Link href="/foretag/var-sida" className="btn-primary mt-6">
        Aktivera abonnemang
      </Link>
    </Card>
  );
}
