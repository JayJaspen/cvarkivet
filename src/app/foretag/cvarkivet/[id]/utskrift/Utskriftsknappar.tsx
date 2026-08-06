'use client';

import Link from 'next/link';

/** Knapparna göms vid utskrift så att bara CV:t hamnar på papperet. */
export default function Utskriftsknappar({ tillbakaHref }: { tillbakaHref: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Link href={tillbakaHref} className="muted hover:text-sand-900">
        ← Tillbaka till CV:t
      </Link>

      <div className="flex gap-2">
        <button type="button" onClick={() => window.print()} className="btn-primary">
          Skriv ut
        </button>
        <button type="button" onClick={() => window.print()} className="btn-secondary">
          Spara som PDF
        </button>
      </div>
    </div>
  );
}
