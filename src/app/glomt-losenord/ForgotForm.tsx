'use client';

import { useFormState } from 'react-dom';
import { requestPasswordReset } from '@/app/actions/auth';
import { Field } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';

export default function ForgotForm() {
  const [state, formAction] = useFormState(requestPasswordReset, undefined);

  if (state?.ok)
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        {state.ok}
      </div>
    );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <Field label="E-postadress" name="email" type="email" required autoComplete="email" />

      <SubmitButton className="btn-primary w-full" pendingText="Skickar…">
        Skicka återställningslänk
      </SubmitButton>
    </form>
  );
}
