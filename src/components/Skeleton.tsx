/**
 * Platshållare som visas medan servern hämtar data.
 *
 * Poängen är inte att spara tid utan att sidan svarar direkt på klicket.
 * Utan detta står användaren kvar på den gamla vyn tills allt är klart,
 * och det känns som att ingenting hände.
 */

export function SkeletonRad({ bredd = 'w-full' }: { bredd?: string }) {
  return <div className={`h-4 animate-pulse rounded bg-sand-200 ${bredd}`} />;
}

export function SkeletonKort({ rader = 3 }: { rader?: number }) {
  return (
    <div className="card space-y-3">
      <SkeletonRad bredd="w-1/3" />
      {Array.from({ length: rader }).map((_, i) => (
        <SkeletonRad key={i} bredd={i === rader - 1 ? 'w-2/3' : 'w-full'} />
      ))}
    </div>
  );
}

export function SkeletonSidhuvud() {
  return (
    <div className="mb-6 space-y-2">
      <div className="h-7 w-56 animate-pulse rounded bg-sand-200" />
      <SkeletonRad bredd="w-96" />
    </div>
  );
}

export function SkeletonTabell({ rader = 5 }: { rader?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-sand-200 bg-white">
      <div className="border-b border-sand-200 bg-sand-100 px-4 py-3">
        <SkeletonRad bredd="w-40" />
      </div>
      {Array.from({ length: rader }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-sand-100 px-4 py-4 last:border-0">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-sand-200" />
          <div className="flex-1 space-y-2">
            <SkeletonRad bredd="w-48" />
            <SkeletonRad bredd="w-64" />
          </div>
          <div className="h-8 w-24 shrink-0 animate-pulse rounded-lg bg-sand-200" />
        </div>
      ))}
    </div>
  );
}

/** Standardvy: rubrik, filterruta och en tabell. */
export default function SidSkelett({ tabell = true }: { tabell?: boolean }) {
  return (
    <>
      <SkeletonSidhuvud />
      <div className="card mb-6 space-y-3">
        <SkeletonRad bredd="w-24" />
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-sand-200" />
          ))}
        </div>
      </div>
      {tabell ? <SkeletonTabell /> : <SkeletonKort rader={5} />}
    </>
  );
}
