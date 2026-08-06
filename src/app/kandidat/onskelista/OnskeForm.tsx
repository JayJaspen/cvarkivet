'use client';

import { useFormState } from 'react-dom';
import { onskaForetag } from '@/app/actions/onskelista';
import { Card, Field } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';

export default function OnskeForm() {
  const [state, action] = useFormState(onskaForetag, undefined);

  return (
    <Card>
      <h2 className="h2 mb-1">Lägg till ett företag</h2>
      <p className="muted mb-4">
        Finns företaget redan i listan läggs din röst till där, även om du stavar lite
        annorlunda.
      </p>

      <form action={action} className="space-y-4">
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

        <Field label="Företagets namn" name="namn" required placeholder="t.ex. Volvo" maxLength={80} />
        <Field
          label="Webbplats (frivilligt)"
          name="website"
          placeholder="foretaget.se"
          hint="Hjälper oss hitta rätt företag när vi hör av oss."
        />

        <SubmitButton className="btn-primary w-full">Önska företaget</SubmitButton>
      </form>
    </Card>
  );
}
