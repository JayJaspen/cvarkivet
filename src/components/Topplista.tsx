import Link from 'next/link';
import { Badge, Card, Empty } from './ui';
import type { Topplisteplats } from '@/lib/topplista';

/**
 * Delad topplistevy. Länkmålet skiljer sig beroende på vem som tittar,
 * därför skickas basadressen in – och utelämnas helt för företag, som inte
 * har någon vy för andra företags profiler.
 */
export default function Topplista({
  platser,
  lankbas,
}: {
  platser: Topplisteplats[];
  lankbas?: string;
}) {
  if (platser.length === 0)
    return (
      <Empty>
        Ingen har markerat något företag som favorit ännu. Listan fylls på allteftersom
        kandidaterna följer företag.
      </Empty>
    );

  const medalj = (plats: number) =>
    plats === 1 ? 'bg-accent-500 text-white' : plats <= 3 ? 'bg-accent-200 text-accent-800' : 'bg-sand-100 text-sand-600';

  return (
    <div className="overflow-hidden rounded-xl border border-sand-200 bg-white">
      {platser.map((f) => {
        const namn = lankbas ? (
          <Link href={`${lankbas}/${f.id}`} className="font-semibold text-brand-600 hover:underline">
            {f.namn}
          </Link>
        ) : (
          <span className="font-semibold text-sand-900">{f.namn}</span>
        );

        return (
          <div
            key={f.id}
            className="flex items-center gap-4 border-b border-sand-100 px-4 py-3 last:border-0"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${medalj(f.plats)}`}
            >
              {f.plats}
            </span>

            {f.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={f.logoUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-lg border border-sand-200 object-contain p-0.5"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-xs font-bold text-sand-500">
                {f.namn.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              {namn}
              <p className="muted">{f.kommun}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {f.aktivaAnnonser > 0 && <Badge tone="blue">{f.aktivaAnnonser} annonser</Badge>}
              <div className="text-right">
                <p className="text-lg font-bold text-brand-600">{f.foljare}</p>
                <p className="text-xs text-sand-500">
                  {f.foljare === 1 ? 'följare' : 'följare'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
