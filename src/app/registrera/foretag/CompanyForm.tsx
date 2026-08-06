'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import { registerCompany } from '@/app/actions/auth';
import { Field, Select } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { BOLAGSTYPER, KOMMUNER, PRISER } from '@/lib/data';

export default function CompanyForm() {
  const [state, formAction] = useFormState(registerCompany, undefined);
  const [typ, setTyp] = useState<'EMPLOYER' | 'AGENCY'>('EMPLOYER');

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div>
        <p className="label">Vilken typ av verksamhet är ni? *</p>
        <div className="space-y-2">
          {(['EMPLOYER', 'AGENCY'] as const).map((id) => (
            <label
              key={id}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                typ === id ? 'border-brand-500 bg-brand-50' : 'border-sand-200'
              }`}
            >
              <input
                type="radio"
                name="companyType"
                value={id}
                checked={typ === id}
                onChange={() => setTyp(id)}
                className="mt-0.5 h-4 w-4 border-sand-300 text-brand-600"
              />
              <span>
                <span className="block text-sm font-medium text-sand-900">
                  {BOLAGSTYPER[id].namn}
                </span>
                <span className="block text-xs text-sand-500">
                  {BOLAGSTYPER[id].beskrivning}
                </span>
                <span className="mt-1 block text-xs font-medium text-brand-700">
                  {PRISER[id].YEARLY.toLocaleString('sv-SE')} kr/år, exkl. moms
                </span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-sand-500">
          Vi kontrollerar uppgiften vid granskningen. Bemannings- och rekryteringsföretag har
          ett eget pris eftersom de använder arkivet för att bemanna åt andra.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Organisationsnummer"
          name="orgNumber"
          required
          placeholder="556677-8899"
          hint="Kontrolleras automatiskt."
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
        hint="Måste vara en företagsadress – Gmail, Hotmail och liknande accepteras inte. Används även som inloggning."
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
          hint="Minst 10 tecken. Vi kontrollerar mot kända dataintrång – tre slumpvisa ord blir både starkt och lätt att minnas."
        />
        <Field label="Upprepa lösenord" name="password2" type="password" required />
      </div>

      <p className="rounded-lg bg-sand-50 p-3 text-xs text-sand-600">
        Logotyp laddar ni upp under <b>Vår sida</b> när kontot är skapat.
      </p>

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
        Registrera företag
      </SubmitButton>
    </form>
  );
}
