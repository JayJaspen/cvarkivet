import Link from 'next/link';
import { Card } from './ui';
import { PLANER } from '@/lib/data';

export default function Paywall({
  title = 'Aktivera en prenumeration för att komma åt tjänsten',
  need = 'CV',
}: {
  title?: string;
  need?: 'CV' | 'CV_ADS';
}) {
  return (
    <Card className="mx-auto max-w-2xl text-center">
      <h2 className="h2">{title}</h2>
      <p className="muted mx-auto mt-2 max-w-md">
        Kontot är gratis, men för att använda tjänsten behöver ni aktivera en prenumeration under
        fliken <b>Vår sida</b>.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(['CV', 'CV_ADS'] as const).map((id) => {
          const p = PLANER[id];
          const räcker = need === 'CV' || id === 'CV_ADS';
          return (
            <div
              key={id}
              className={`rounded-xl border p-5 text-left ${
                räcker ? 'border-brand-300 bg-brand-50' : 'border-slate-200'
              }`}
            >
              <p className="font-semibold">{p.namn}</p>
              <p className="mt-1 text-2xl font-bold text-brand-600">
                {p.pris} kr
                <span className="text-sm font-normal text-slate-500">/mån exkl. moms</span>
              </p>
              <p className="muted mt-2">{p.beskrivning}</p>
            </div>
          );
        })}
      </div>

      <Link href="/foretag/var-sida" className="btn-primary mt-6">
        Gå till Vår sida
      </Link>
    </Card>
  );
}
