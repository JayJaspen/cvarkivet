'use client';

import { useFormState } from 'react-dom';
import { saveJobAd } from '@/app/actions/company';
import { Card, Field, Select, TextArea } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { KATEGORIER, KOMMUNER_MED_DISTANS } from '@/lib/data';

export default function AdForm() {
  const [state, formAction] = useFormState(saveJobAd, undefined);

  return (
    <Card>
      <h2 className="h2 mb-4">Ny annons</h2>
      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {state.error}
          </div>
        )}
        {state?.ok && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {state.ok}
          </div>
        )}

        <Field label="Rubrik" name="title" required placeholder="Lagermedarbetare till vårt team" />
        <TextArea
          label="Annonstext"
          name="body"
          rows={8}
          placeholder="Beskriv tjänsten, arbetsuppgifter och vad ni söker."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Kommun"
            name="municipality"
            options={KOMMUNER_MED_DISTANS}
            required
            includeBlank
            blankLabel="Välj kommun…"
          />
          <Select
            label="Kategori"
            name="category"
            options={KATEGORIER}
            required
            includeBlank
            blankLabel="Välj kategori…"
          />
        </div>

        <Field
          label="E-postadress för ansökan"
          name="applyEmail"
          type="email"
          placeholder="jobb@foretaget.se"
        />
        <Field
          label="Eller länk till rekryteringssystem"
          name="applyUrl"
          placeholder="https://…"
          hint="Fyll i minst en av dem."
        />

        <Field label="Sista ansökningsdatum" name="deadline" type="date" required />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lön från (kr/mån)" name="salaryMin" inputMode="numeric" />
          <Field label="Lön till (kr/mån)" name="salaryMax" inputMode="numeric" />
        </div>

        <SubmitButton className="btn-primary w-full" pendingText="Publicerar…">
          Publicera annons
        </SubmitButton>
      </form>
    </Card>
  );
}
