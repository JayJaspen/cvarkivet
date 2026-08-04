'use client';

import { useFormState } from 'react-dom';
import { changeCompanyPassword, updateCompany } from '@/app/actions/company';
import { Card, Field, Select, TextArea } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { KOMMUNER } from '@/lib/data';

type CompanyLite = {
  orgNumber: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  municipality: string;
  website: string | null;
  presentation: string | null;
  logoUrl: string | null;
};

function Msg({ state }: { state: { error?: string; ok?: string } | undefined }) {
  if (!state) return null;
  if (state.error)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {state.error}
      </div>
    );
  if (state.ok)
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        {state.ok}
      </div>
    );
  return null;
}

export default function CompanyForms({ company }: { company: CompanyLite }) {
  const [state, action] = useFormState(updateCompany, undefined);
  const [pwState, pwAction] = useFormState(changeCompanyPassword, undefined);

  return (
    <>
      <Card>
        <h2 className="h2 mb-4">Företagsuppgifter</h2>
        <form action={action} className="space-y-4">
          <Msg state={state} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Organisationsnummer</label>
              <input className="input" value={company.orgNumber} disabled />
              <p className="mt-1 text-xs text-slate-500">
                Kontakta support för att ändra organisationsnummer.
              </p>
            </div>
            <Field
              label="Företagsnamn"
              name="name"
              required
              defaultValue={company.name}
              hint="Visas för kandidaterna."
            />
            <Field label="Kontaktperson" name="contactName" required defaultValue={company.contactName} />
            <Field label="Telefon" name="phone" type="tel" required defaultValue={company.phone} />
            <Field label="E-postadress" name="email" type="email" required defaultValue={company.email} />
            <Field label="Webbplats" name="website" defaultValue={company.website ?? ''} />
            <Field label="Adress" name="address" required defaultValue={company.address} />
            <Select
              label="Hemmahörande kommun"
              name="municipality"
              options={KOMMUNER}
              defaultValue={company.municipality}
              required
            />
          </div>

          <TextArea
            label="Företagspresentation"
            name="presentation"
            rows={7}
            defaultValue={company.presentation}
            placeholder="Berätta om er verksamhet, kultur och varför man ska jobba hos er."
            hint="Visas på er profilsida för kandidaterna."
          />

          <div>
            <label className="label">Logotyp</label>
            {company.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt="Logotyp"
                className="mb-2 h-16 w-16 rounded-lg border border-slate-200 object-contain"
              />
            )}
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP eller SVG. Max 2 MB.</p>
          </div>

          <div className="flex justify-end">
            <SubmitButton>Spara uppgifter</SubmitButton>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="h2 mb-4">Byt lösenord</h2>
        <form action={pwAction} className="space-y-4">
          <Msg state={pwState} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Nuvarande lösenord" name="current" type="password" required />
            <Field label="Nytt lösenord" name="next" type="password" required />
            <Field label="Upprepa nytt" name="next2" type="password" required />
          </div>
          <div className="flex justify-end">
            <SubmitButton>Byt lösenord</SubmitButton>
          </div>
        </form>
      </Card>
    </>
  );
}
