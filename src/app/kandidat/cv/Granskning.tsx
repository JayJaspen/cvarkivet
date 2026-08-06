'use client';

import { useTransition } from 'react';
import { begarCvGranskning } from '@/app/actions/ai';
import { Card } from '@/components/ui';

export type Forslag = { rubrik: string; forslag: string; allvar: 'hog' | 'medel' | 'lag' };

export default function Granskning({
  granskning,
  inaktuell,
}: {
  granskning: {
    summary: string;
    completeness: number;
    suggestions: Forslag[];
    createdAt: Date;
  } | null;
  inaktuell: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const allvarston = (a: Forslag['allvar']) =>
    a === 'hog'
      ? 'border-accent-300 bg-accent-50'
      : a === 'medel'
        ? 'border-sand-300 bg-sand-50'
        : 'border-sand-200 bg-white';

  const allvarstext = (a: Forslag['allvar']) =>
    a === 'hog' ? 'Viktigast' : a === 'medel' ? 'Bra att fixa' : 'Finputsning';

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="h2">Låt AI granska ditt CV</h2>
          <p className="muted mt-1 max-w-xl">
            Du får konkreta förslag på vad som saknas eller kan skärpas. Granskningen tittar
            bara på innehållet i CV:t – ingenting sparas hos AI-tjänsten och företagen ser
            aldrig återkopplingen.
          </p>
        </div>

        <button
          type="button"
          onClick={() => startTransition(() => begarCvGranskning())}
          disabled={pending}
          className="btn-accent shrink-0"
        >
          {pending ? 'Granskar…' : granskning ? 'Granska igen' : 'Granska mitt CV'}
        </button>
      </div>

      {pending && (
        <p className="mt-4 text-sm text-sand-600">
          Läser igenom ditt CV. Det tar några sekunder.
        </p>
      )}

      {granskning && !pending && (
        <div className="mt-5 space-y-4">
          {inaktuell && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Du har ändrat ditt CV sedan granskningen gjordes. Kör en ny för aktuella förslag.
            </p>
          )}

          <div className="flex items-center gap-4 rounded-lg bg-sand-50 p-4">
            <div className="shrink-0 text-center">
              <p className="text-2xl font-bold text-brand-600">{granskning.completeness}%</p>
              <p className="text-xs text-sand-500">komplett</p>
            </div>
            <p className="text-sm text-sand-800">{granskning.summary}</p>
          </div>

          {granskning.suggestions.length > 0 && (
            <div className="space-y-2">
              {granskning.suggestions.map((f, i) => (
                <div key={i} className={`rounded-lg border p-3 ${allvarston(f.allvar)}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sand-900">{f.rubrik}</p>
                    <span className="text-xs text-sand-500">{allvarstext(f.allvar)}</span>
                  </div>
                  <p className="mt-1 text-sm text-sand-800">{f.forslag}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-sand-500">
            Granskad {granskning.createdAt.toLocaleDateString('sv-SE')}. Förslagen är
            automatiskt genererade – väg dem mot vad du själv vet om branschen.
          </p>
        </div>
      )}
    </Card>
  );
}
