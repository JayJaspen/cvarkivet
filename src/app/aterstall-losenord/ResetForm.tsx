'use client';

import { useFormState } from 'react-dom';
import { resetPassword } from '@/app/actions/auth';
import { Field } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';

export default function ResetForm({ token }: { token: string }) {
  const [state, formAction] = useFormState(resetPassword, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <input type="hidden" name="token" value={token} />
      <Field
        label="Nytt lösenord"
        name="password"
        type="password"
        required
        autoComplete="new-password"
      />
      <Field label="Upprepa nytt lösenord" name="password2" type="password" required />

      <SubmitButton className="btn-primary w-full" pendingText="Sparar…">
        Spara nytt lösenord
      </SubmitButton>
    </form>
  );
}
