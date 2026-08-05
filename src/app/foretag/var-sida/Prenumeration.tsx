'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { activateSubscription, updateInvoiceSettings } from '@/app/actions/company';
import { Badge, Card, Field } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import {
  arsbesparing,
  bolagstypText,
  FAKTURASATT,
  fakturasattText,
  PERIODER,
  planNamnFor,
  pris,
  prisInklMoms,
} from '@/lib/data';

type CompanyLite = {
  companyType: string;
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
  subscriptionEndsAt: Date | null;
};

const datum = (d: Date | null | undefined) => d?.toLocaleDateString('sv-SE') ?? '';
const kr = (n: number) => n.toLocaleString('sv-SE');

function Fakturaval({ company, idPrefix }: { company: CompanyLite; idPrefix: string }) {
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
            <span className="block text-sm font-medium text-slate-900">{FAKTURASATT[id].namn}</span>
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
          hint="Hit skickas fakturan som PDF."
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
        </div>
      )}

      <Field
        label="Er referens eller beställarkod (frivilligt)"
        name="invoiceRef"
        defaultValue={company.invoiceRef ?? ''}
        placeholder="t.ex. kostnadsställe eller namn"
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
  const [valdPeriod, setValdPeriod] = useState<string | null>(null);

  const blocked = company.blockedUntil && company.blockedUntil > new Date();
  const godkant = company.status === 'APPROVED';
  const harPrenumeration = company.subscription !== 'NONE';
  const uppsagt = Boolean(company.cancelledAt) && harPrenumeration;
  const besparing = arsbesparing(company.companyType);

  return (
    <>
      <Card>
        <h2 className="h2 mb-1">Prenumeration</h2>
        <p className="muted">
          Nuvarande: <b>{planNamnFor(company.subscription, company.companyType)}</b>
          {company.subscriptionStarted && ` sedan ${datum(company.subscriptionStarted)}`}
        </p>
        <p className="muted mb-4">
          Ert konto är registrerat som <b>{bolagstypText(company.companyType)}</b>. Stämmer det
          inte, hör av er till support så ändrar vi.
        </p>

        <Meddelande state={aktState} />

        {!godkant && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Prenumeration kan tecknas när kontot är godkänt.
          </div>
        )}

        {uppsagt && company.subscriptionEndsAt && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Ni sade upp abonnemanget {datum(company.cancelledAt)}. Ni har kvar full åtkomst till
            och med <b>{datum(company.subscriptionEndsAt)}</b>, som ni betalat för.
          </div>
        )}

        {blocked && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Ni sade upp ert månadsabonnemang {datum(company.cancelledAt)}. Ett nytt kan tecknas
            tidigast <b>{datum(company.blockedUntil)}</b>.
          </div>
        )}

        <div className="space-y-3">
          {(['YEARLY', 'MONTHLY'] as const).map((period) => {
            const p = PERIODER[period];
            const belopp = pris(company.companyType, period);
            const nuvarande = company.subscription === period;
            const oppen = valdPeriod === period;

            return (
              <div
                key={period}
                className={`rounded-xl border p-4 ${
                  nuvarande ? 'border-brand-500 bg-brand-50' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold">{p.namn}</p>
                  <div className="flex gap-1">
                    {period === 'YEARLY' && besparing > 0 && (
                      <Badge tone="green">Spara {kr(besparing)} kr</Badge>
                    )}
                    {nuvarande && <Badge tone="blue">Aktivt</Badge>}
                  </div>
                </div>

                <p className="mt-1 text-2xl font-bold text-brand-600">
                  {kr(belopp)} kr
                  <span className="text-sm font-normal text-slate-500">
                    {p.enhet} exkl. moms
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {kr(prisInklMoms(belopp))} kr inkl. moms
                  {period === 'YEARLY' &&
                    ` · motsvarar ${kr(Math.round(belopp / 12))} kr/mån`}
                </p>

                <p className="muted mt-2">
                  Full tillgång till CVArkivet och egna annonser.
                  {period === 'YEARLY'
                    ? ' Betalas en gång och gäller ett år.'
                    : ' Faktureras varje månad, uppsägningsbart löpande.'}
                </p>

                {!nuvarande && !oppen && (
                  <button
                    type="button"
                    onClick={() => setValdPeriod(period)}
                    disabled={!!blocked || !godkant}
                    className="btn-primary mt-3 w-full"
                  >
                    {harPrenumeration ? 'Byt till detta' : 'Välj detta'}
                  </button>
                )}

                {oppen && (
                  <form action={aktivera} className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                    <input type="hidden" name="period" value={period} />
                    <Fakturaval company={company} idPrefix={`akt-${period}`} />

                    <div className="flex flex-wrap gap-2">
                      <SubmitButton pendingText="Aktiverar…">
                        Aktivera för {kr(belopp)} kr{p.enhet}
                      </SubmitButton>
                      <button
                        type="button"
                        onClick={() => setValdPeriod(null)}
                        className="btn-secondary"
                      >
                        Avbryt
                      </button>
                    </div>

                    <p className="text-xs text-slate-500">
                      {period === 'YEARLY'
                        ? 'Årsabonnemanget gäller ett år från idag. Säger ni upp det i förtid behåller ni åtkomsten perioden ut, men ingen återbetalning sker.'
                        : 'Månadsabonnemanget kan sägas upp när som helst. Efter uppsägning kan ett nytt tecknas tidigast två månader senare.'}
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
            {company.invoiceMethod === 'EMAIL' &&
              company.invoiceEmail &&
              ` till ${company.invoiceEmail}`}
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
