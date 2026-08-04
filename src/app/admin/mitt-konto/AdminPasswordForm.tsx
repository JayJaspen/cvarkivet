'use client';

import { useFormState } from 'react-dom';
import { changeAdminPassword } from '@/app/actions/admin';
import { Card, Field } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';

export default function AdminPasswordForm() {
  const [state, action] = useFormState(changeAdminPassword, undefined);

  return (
    <Card>
      <h2 className="h2 mb-4">Byt lösenord</h2>
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

        <Field
          label="Nuvarande lösenord"
          name="current"
          type="password"
          required
          autoComplete="current-password"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nytt lösenord"
            name="next"
            type="password"
            required
            autoComplete="new-password"
            hint="Minst 12 tecken."
          />
          <Field label="Upprepa nytt lösenord" name="next2" type="password" required />
        </div>

        <div className="flex justify-end">
          <SubmitButton>Byt lösenord</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
