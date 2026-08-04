'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import { registerCompany } from '@/app/actions/auth';
import { Field, Select } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { KOMMUNER } from '@/lib/data';

export default function CompanyForm() {
  const [state, formAction] = useFormState(registerCompany, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Organisationsnummer"
          name="orgNumber"
          required
          placeholder="556677-8899"
        />
        <Field
          label="Företagsnamn"
          name="name"
          required
          hint="Det här namnet visas för kandidaterna."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kontaktperson" name="contactName" required />
        <Field label="Telefon till kontaktperson" name="phone" type="tel" required />
      </div>

      <Field
        label="E-postadress till kontaktperson"
        name="email"
        type="email"
        required
        hint="Används även som inloggning."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Adress" name="address" required placeholder="Storgatan 1, 111 22 Stockholm" />
        <Select
          label="Hemmahörande kommun"
          name="municipality"
          options={KOMMUNER}
          required
          includeBlank
          blankLabel="Välj kommun…"
        />
      </div>

      <Field label="Webbplats (frivilligt)" name="website" placeholder="företaget.se" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Lösenord"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          hint="Minst 8 tecken."
        />
        <Field label="Upprepa lösenord" name="password2" type="password" required />
      </div>

      <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
        Logotyp laddar ni upp under <b>Vår sida</b> när kontot är skapat.
      </p>

      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          name="terms"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600"
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
        Registrera företag
      </SubmitButton>
    </form>
  );
}
