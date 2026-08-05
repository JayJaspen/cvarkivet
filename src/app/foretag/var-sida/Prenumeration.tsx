'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { activateSubscription, updateInvoiceSettings } from '@/app/actions/company';
import { Badge, Card, Field } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import { FAKTURASATT, PLANER, planNamn, prisInklMoms, fakturasattText } from '@/lib/data';

type CompanyLite = {
  subscription: string;
  status: string;
  address: string;
  email: string;
  invoiceMethod: string | null;
  invoiceAddress: string | null;
  invoiceEmail: string | null;
  invoiceRef: string | null;
  blockedUntil: Date | null;
  cancelledAt: Date | null;
  subscriptionStarted: Date | null;
};

function Fakturaval({
  company,
  idPrefix,
}: {
  company: CompanyLite;
  idPrefix: string;
}) {
  const [metod, setMetod] = useState(company.invoiceMethod ?? 'EMAIL');

  return (
    <div className="space-y-3">
      <p className="label">Hur vill ni ta emot fakturan?</p>

      {(['EMAIL', 'PAPER'] as const).map((id) => (
        <label
          key={id}
          className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
            metod === id ? 'border-brand-500 bg-brand-50' : 'border-slate-200'
          }`}
        >
          <input
            type="radio"
            name="invoiceMethod"
            value={id}
            checked={metod === id}
            onChange={() => setMetod(id)}
            className="mt-0.5 h-4 w-4 border-slate-300 text-brand-600"
          />
          <span>
            <span className="block text-sm font-medium text-slate-900">
              {FAKTURASATT[id].namn}
            </span>
            <span className="block text-xs text-slate-500">{FAKTURASATT[id].beskrivning}</span>
          </span>
        </label>
      ))}

      {metod === 'EMAIL' ? (
        <Field
          label="E-postadress för faktura"
          name="invoiceEmail"
          type="email"
          required
          defaultValue={company.invoiceEmail ?? company.email}
          hint="Hit skickas fakturan som PDF. Kan vara en annan adress än inloggningen."
          id={`${idPrefix}-email`}
        />
      ) : (
        <div>
          <label className="label" htmlFor={`${idPrefix}-address`}>
            Fakturaadress <span className="text-red-500">*</span>
          </label>
          <textarea
            id={`${idPrefix}-address`}
            name="invoiceAddress"
            rows={3}
            required
            defaultValue={company.invoiceAddress ?? company.address}
            className="input"
            placeholder={'Företaget AB\nFakturagatan 1\n111 22 Stockholm'}
          />
          <p className="mt-1 text-xs text-slate-500">
            Skriv fullständig postadress inklusive postnummer och ort.
          </p>
        </div>
      )}

      <Field
        label="Er referens eller beställarkod (frivilligt)"
        name="invoiceRef"
        defaultValue={company.invoiceRef ?? ''}
        placeholder="t.ex. kostnadsställe eller namn"
        hint="Skrivs ut på fakturan om ni behöver det för er attestering."
        id={`${idPrefix}-ref`}
      />
    </div>
  );
}

function Meddelande({ state }: { state: { error?: string; ok?: string } | undefined }) {
  if (!state) return null;
  if (state.error)
    return (
      <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {state.error}
      </div>
    );
  if (state.ok)
    return (
      <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        {state.ok}
      </div>
    );
  return null;
}

export default function Prenumeration({ company }: { company: CompanyLite }) {
  const [aktState, aktivera] = useFormState(activateSubscription, undefined);
  const [fakturaState, sparaFaktura] = useFormState(updateInvoiceSettings, undefined);
  const [valtPaket, setValtPaket] = useState<string | null>(null);

  const blocked = company.blockedUntil && company.blockedUntil > new Date();
  const godkant = company.status === 'APPROVED';
  const harPrenumeration = company.subscription !== 'NONE';

  return (
    <>
      <Card>
        <h2 className="h2 mb-1">Prenumeration</h2>
        <p className="muted mb-4">
          Nuvarande: <b>{planNamn(company.subscription)}</b>
          {company.subscriptionStarted &&
            ` sedan ${company.subscriptionStarted.toLocaleDateString('sv-SE')}`}
        </p>

        <Meddelande state={aktState} />

        {!godkant && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Prenumeration kan tecknas när kontot är godkänt.
          </div>
        )}

        {blocked && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Ni sade upp er prenumeration {company.cancelledAt?.toLocaleDateString('sv-SE')}. En ny
            kan tecknas tidigast <b>{company.blockedUntil?.toLocaleDateString('sv-SE')}</b>.
          </div>
        )}

        <div className="space-y-3">
          {(['CV', 'CV_ADS'] as const).map((id) => {
            const p = PLANER[id];
            const nuvarande = company.subscription === id;
            const oppen = valtPaket === id;

            return (
              <div
                key={id}
                className={`rounded-xl border p-4 ${
                  nuvarande ? 'border-brand-500 bg-brand-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{p.namn}</p>
                  {nuvarande && <Badge tone="blue">Aktiv</Badge>}
                </div>
                <p className="mt-1 text-2xl font-bold text-brand-600">
                  {p.pris} kr
                  <span className="text-sm font-normal text-slate-500">/mån exkl. moms</span>
                </p>
                <p className="text-xs text-slate-500">{prisInklMoms(p.pris)} kr inkl. moms</p>
                <p className="muted mt-1">{p.beskrivning}</p>

                {!nuvarande && !oppen && (
                  <button
                    type="button"
                    onClick={() => setValtPaket(id)}
                    disabled={!!blocked || !godkant}
                    className="btn-primary mt-3 w-full"
                  >
                    {harPrenumeration ? 'Byt till detta paket' : 'Välj detta paket'}
                  </button>
                )}

                {oppen && (
                  <form action={aktivera} className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                    <input type="hidden" name="plan" value={id} />
                    <Fakturaval company={company} idPrefix={`akt-${id}`} />

                    <div className="flex flex-wrap gap-2">
                      <SubmitButton pendingText="Aktiverar…">
                        Aktivera {p.pris} kr/mån
                      </SubmitButton>
                      <button
                        type="button"
                        onClick={() => setValtPaket(null)}
                        className="btn-secondary"
                      >
                        Avbryt
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Prenumerationen löper månadsvis och kan sägas upp när som helst. Efter
                      uppsägning kan en ny tecknas tidigast två månader senare.
                    </p>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {harPrenumeration && (
        <Card>
          <h2 className="h2 mb-1">Faktureringsuppgifter</h2>
          <p className="muted mb-4">
            Nuvarande: <b>{fakturasattText(company.invoiceMethod)}</b>
            {company.invoiceMethod === 'EMAIL' && company.invoiceEmail && ` till ${company.invoiceEmail}`}
          </p>

          <Meddelande state={fakturaState} />

          <form action={sparaFaktura} className="space-y-4">
            <Fakturaval company={company} idPrefix="andra" />
            <div className="flex justify-end">
              <SubmitButton>Spara faktureringsuppgifter</SubmitButton>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}
