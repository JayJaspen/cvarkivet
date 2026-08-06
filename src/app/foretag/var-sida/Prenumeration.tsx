'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { activateSubscription, updateInvoiceSettings } from '@/app/actions/company';
import { Badge, Card, Field } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';
import {
  arPilot,
  bolagstypText,
  FAKTURASATT,
  fakturasattText,
  manadskostnad,
  PERIODER,
  planNamnFor,
  pris,
  prisInklMoms,
} from '@/lib/data';

type CompanyLite = {
  companyType: string;
  subscription: string;
  status: string;
  isPilot: boolean;
  pilotUntil: Date | null;
  address: string | null;
  email: string;
  invoiceMethod: string | null;
  invoiceAddress: string | null;
  invoiceEmail: string | null;
  invoiceRef: string | null;
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
            metod === id ? 'border-brand-500 bg-brand-50' : 'border-sand-200'
          }`}
        >
          <input
            type="radio"
            name="invoiceMethod"
            value={id}
            checked={metod === id}
            onChange={() => setMetod(id)}
            className="mt-0.5 h-4 w-4 border-sand-300 text-brand-600"
          />
          <span>
            <span className="block text-sm font-medium text-sand-900">{FAKTURASATT[id].namn}</span>
            <span className="block text-xs text-sand-500">{FAKTURASATT[id].beskrivning}</span>
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
            defaultValue={company.invoiceAddress ?? company.address ?? ''}
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
  const [oppen, setOppen] = useState(false);

  const godkant = company.status === 'APPROVED';
  const harPrenumeration = company.subscription !== 'NONE';
  const uppsagt = Boolean(company.cancelledAt) && harPrenumeration;
  const gammaltManadsabonnemang = company.subscription === 'MONTHLY';
  const pilot = arPilot(company);
  const belopp = pris(company.companyType);

  // Pilotkunder har full åtkomst utan att betala. De ska inte mötas av en
  // prislapp eller en aktiveringsknapp – det vore bara förvirrande.
  if (pilot)
    return (
      <Card>
        <h2 className="h2 mb-1">Pilotkund</h2>
        <p className="muted">
          Ni har full tillgång till CVArkivet och annonsering utan kostnad
          {company.pilotUntil ? ` till och med ${datum(company.pilotUntil)}` : ' tills vidare'}.
        </p>
        <div className="mt-4 rounded-xl border border-brand-300 bg-brand-50 p-4">
          <p className="font-semibold text-sand-900">Allt ingår</p>
          <p className="muted mt-1">
            Hela CV-arkivet, obegränsat antal annonser och direktkontakt med kandidaterna.
            Ingen faktura skickas under pilotperioden.
          </p>
          {company.pilotUntil && (
            <p className="muted mt-2">
              Vi hör av oss i god tid innan {datum(company.pilotUntil)} om hur ni vill göra
              sedan.
            </p>
          )}
        </div>
      </Card>
    );

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

        {gammaltManadsabonnemang && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Ert konto ligger kvar på den tidigare månadsprislistan. Månadsbetalning erbjuds inte
            längre – vid nästa förnyelse går ni över till årsabonnemang. Hör av er till supporten
            om ni har frågor.
          </div>
        )}

        <div
          className={`rounded-xl border p-4 ${
            harPrenumeration ? 'border-brand-500 bg-brand-50' : 'border-sand-200'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-semibold">{PERIODER.YEARLY.namn}</p>
            {harPrenumeration && <Badge tone="blue">Aktivt</Badge>}
          </div>

          <p className="mt-1 text-3xl font-bold text-brand-600">
            {kr(belopp)} kr
            <span className="text-sm font-normal text-sand-500">/år exkl. moms</span>
          </p>
          <p className="text-xs text-sand-500">
            {kr(prisInklMoms(belopp))} kr inkl. moms · motsvarar{' '}
            {kr(manadskostnad(company.companyType))} kr/mån
          </p>

          <p className="muted mt-2">
            Allt ingår: hela CV-arkivet, obegränsat antal annonser och direktkontakt med
            kandidaterna. Betalas en gång och gäller ett år.
          </p>

          {!oppen && (
            <button
              type="button"
              onClick={() => setOppen(true)}
              disabled={!godkant}
              className="btn-primary mt-3 w-full"
            >
              {harPrenumeration ? 'Förnya ett år till' : 'Aktivera abonnemang'}
            </button>
          )}

          {oppen && (
            <form action={aktivera} className="mt-4 space-y-4 border-t border-sand-200 pt-4">
              <Fakturaval company={company} idPrefix="akt" />

              <div className="flex flex-wrap gap-2">
                <SubmitButton pendingText="Aktiverar…">
                  Aktivera för {kr(belopp)} kr/år
                </SubmitButton>
                <button type="button" onClick={() => setOppen(false)} className="btn-secondary">
                  Avbryt
                </button>
              </div>

              <p className="text-xs text-sand-500">
                Abonnemanget gäller ett år från idag. Säger ni upp det i förtid behåller ni
                åtkomsten perioden ut, men ingen återbetalning sker.
              </p>
            </form>
          )}
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
