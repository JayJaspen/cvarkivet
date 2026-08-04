'use client';

import { useFormState } from 'react-dom';
import { login } from '@/app/actions/auth';
import { Field } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';

export default function LoginForm() {
  const [state, formAction] = useFormState(login, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <Field label="E-postadress" name="email" type="email" required autoComplete="email" />
      <Field
        label="Lösenord"
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />

      <SubmitButton className="btn-primary w-full" pendingText="Loggar in…">
        Logga in
      </SubmitButton>
    </form>
  );
}
