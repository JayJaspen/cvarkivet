'use client';

import { useFormState } from 'react-dom';
import SubmitButton from '@/components/SubmitButton';
import type { AiSvar } from '@/app/actions/ai';

/**
 * Knappen som utlöser ett AI-anrop.
 *
 * Alla AI-funktioner går genom den här, och den finns för att svaret ska
 * kunna säga ifrån: nås dygnskvoten, eller är funktionen avstängd, får
 * användaren veta det på plats i stället för att knappen bara inte gör något.
 */
export default function AiKnapp({
  action,
  etikett,
  arbetar,
  jobAdId,
  className = 'btn-secondary w-full',
}: {
  action: (prev: AiSvar, form: FormData) => Promise<AiSvar>;
  etikett: string;
  arbetar: string;
  jobAdId?: string;
  className?: string;
}) {
  const [state, kor] = useFormState(action, undefined);

  return (
    <form action={kor}>
      {jobAdId && <input type="hidden" name="jobAdId" value={jobAdId} />}

      <SubmitButton className={className} pendingText={arbetar}>
        {etikett}
      </SubmitButton>

      {state?.error && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
          {state.error}
        </p>
      )}
      {state?.ok && <p className="mt-2 text-xs text-sand-500">{state.ok}</p>}
    </form>
  );
}
