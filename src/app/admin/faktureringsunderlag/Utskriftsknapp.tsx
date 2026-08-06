'use client';

import Link from 'next/link';

export default function Utskriftsknapp() {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Link href="/admin/foretag" className="muted hover:text-sand-900">
        ← Registrerade företag
      </Link>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/faktureringsunderlag" className="btn-secondary">
          Alla
        </Link>
        <Link href="/admin/faktureringsunderlag?plan=YEARLY" className="btn-secondary">
          Endast år
        </Link>
        <Link href="/admin/faktureringsunderlag?plan=MONTHLY" className="btn-secondary">
          Endast månad
        </Link>
        <button type="button" onClick={() => window.print()} className="btn-primary">
          Skriv ut eller spara som PDF
        </button>
      </div>
    </div>
  );
}
