'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import { registerUser } from '@/app/actions/auth';
import { Field } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';

export default function UserForm() {
  const [state, formAction] = useFormState(registerUser, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Förnamn" name="firstName" required autoComplete="given-name" />
        <Field label="Efternamn" name="lastName" required autoComplete="family-name" />
      </div>

      <Field
        label="Födelsedatum"
        name="birthDate"
        required
        placeholder="ÅÅÅÅMMDD"
        inputMode="numeric"
        hint="Vi sparar aldrig fullständigt personnummer. Födelsedatumet visas inte för företag – de ser bara din ålder."
      />

      <Field label="E-postadress" name="email" type="email" required autoComplete="email" />
      <Field label="Telefonnummer" name="phone" type="tel" required autoComplete="tel" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Lösenord"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          hint="Minst 10 tecken. Vi kontrollerar mot kända dataintrång – tre slumpvisa ord blir både starkt och lätt att minnas."
        />
        <Field label="Upprepa lösenord" name="password2" type="password" required />
      </div>

      <label className="flex items-start gap-2 text-sm text-sand-600">
        <input
          type="checkbox"
          name="terms"
          className="mt-0.5 h-4 w-4 rounded border-sand-300 text-brand-600"
        />
        <span>
          Jag godkänner{' '}
          <Link href="/villkor" className="text-brand-600 hover:underline" target="_blank">
            användarvillkoren
          </Link>{' '}
          och{' '}
          <Link
            href="/integritetspolicy"
            className="text-brand-600 hover:underline"
            target="_blank"
          >
            integritetspolicyn
          </Link>
          .
        </span>
      </label>

      <SubmitButton className="btn-primary w-full" pendingText="Skapar konto…">
        Skapa konto
      </SubmitButton>
    </form>
  );
}
