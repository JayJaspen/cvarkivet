import Link from 'next/link';
import { Card } from './ui';
import { bolagstypText, PERIODER, pris, prisInklMoms } from '@/lib/data';

const kr = (n: number) => n.toLocaleString('sv-SE');

export default function Paywall({
  companyType = 'EMPLOYER',
  title = 'Aktivera en prenumeration för att komma åt tjänsten',
}: {
  companyType?: string;
  title?: string;
}) {
  return (
    <Card className="mx-auto max-w-2xl text-center">
      <h2 className="h2">{title}</h2>
      <p className="muted mx-auto mt-2 max-w-md">
        Kontot är gratis, men för att söka bland CV och publicera annonser behöver ni aktivera en
        prenumeration under fliken <b>Vår sida</b>.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(['YEARLY', 'MONTHLY'] as const).map((period) => {
          const belopp = pris(companyType, period);
          return (
            <div
              key={period}
              className={`rounded-xl border p-5 text-left ${
                period === 'YEARLY' ? 'border-brand-300 bg-brand-50' : 'border-slate-200'
              }`}
            >
              <p className="font-semibold">{PERIODER[period].namn}</p>
              <p className="mt-1 text-2xl font-bold text-brand-600">
                {kr(belopp)} kr
                <span className="text-sm font-normal text-slate-500">
                  {PERIODER[period].enhet} exkl. moms
                </span>
              </p>
              <p className="text-xs text-slate-500">{kr(prisInklMoms(belopp))} kr inkl. moms</p>
              <p className="muted mt-2">Full tillgång till CVArkivet och egna annonser.</p>
            </div>
          );
        })}
      </div>

      <p className="muted mt-4">Priserna gäller {bolagstypText(companyType).toLowerCase()}.</p>

      <Link href="/foretag/var-sida" className="btn-primary mt-6">
        Gå till Vår sida
      </Link>
    </Card>
  );
}
