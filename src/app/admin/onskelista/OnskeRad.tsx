'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import {
  markeraSomRegistrerat,
  raderaOnskemal,
  rattaOnskemal,
  satStatusOnskemal,
  slaIhopOnskemal,
} from '@/app/actions/onskelista';
import { Badge } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';

type Onskemal = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  status: string;
  roster: number;
  createdAt: Date;
};

export default function OnskeRad({
  onskemal,
  alla,
}: {
  onskemal: Onskemal;
  alla: { id: string; name: string }[];
}) {
  const [lage, setLage] = useState<'stangd' | 'rätta' | 'slaIhop'>('stangd');
  const [rattaState, ratta] = useFormState(rattaOnskemal, undefined);
  const [ihopState, slaIhop] = useFormState(slaIhopOnskemal, undefined);

  const andra = alla.filter((a) => a.id !== onskemal.id);

  return (
    <div className="rounded-lg border border-sand-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sand-900">{onskemal.name}</p>
          <p className="muted">
            {onskemal.roster} {onskemal.roster === 1 ? 'kandidat' : 'kandidater'}
            {onskemal.website ? ` · ${onskemal.website}` : ''} · normaliserat:{' '}
            <code className="rounded bg-sand-100 px-1">{onskemal.slug}</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onskemal.status === 'PENDING' && <Badge tone="amber">Väntar</Badge>}
          {onskemal.status === 'HIDDEN' && <Badge tone="red">Dold</Badge>}

          {onskemal.status !== 'APPROVED' && (
            <form action={satStatusOnskemal}>
              <input type="hidden" name="id" value={onskemal.id} />
              <input type="hidden" name="status" value="APPROVED" />
              <button className="btn-primary" type="submit">
                Godkänn
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => setLage(lage === 'rätta' ? 'stangd' : 'rätta')}
            className="btn-secondary"
          >
            Rätta
          </button>

          {andra.length > 0 && (
            <button
              type="button"
              onClick={() => setLage(lage === 'slaIhop' ? 'stangd' : 'slaIhop')}
              className="btn-secondary"
            >
              Slå ihop
            </button>
          )}

          {onskemal.status === 'APPROVED' && (
            <form action={satStatusOnskemal}>
              <input type="hidden" name="id" value={onskemal.id} />
              <input type="hidden" name="status" value="HIDDEN" />
              <button className="btn-secondary" type="submit">
                Dölj
              </button>
            </form>
          )}

          <form action={markeraSomRegistrerat}>
            <input type="hidden" name="id" value={onskemal.id} />
            <button className="btn-secondary" type="submit" title="Om företaget registrerat sig men automatiken missat kopplingen">
              Har registrerat sig
            </button>
          </form>

          <form action={raderaOnskemal}>
            <input type="hidden" name="id" value={onskemal.id} />
            <button className="btn-danger" type="submit">
              Radera
            </button>
          </form>
        </div>
      </div>

      {lage === 'rätta' && (
        <form action={ratta} className="mt-4 space-y-3 border-t border-sand-200 pt-4">
          <input type="hidden" name="id" value={onskemal.id} />
          {rattaState?.error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">
              {rattaState.error}
            </p>
          )}
          {rattaState?.ok && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-800">
              {rattaState.ok}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="namn"
              defaultValue={onskemal.name}
              className="input"
              placeholder="Företagsnamn"
              maxLength={80}
            />
            <input
              name="website"
              defaultValue={onskemal.website ?? ''}
              className="input"
              placeholder="Webbplats"
            />
          </div>
          <SubmitButton>Spara ändring</SubmitButton>
        </form>
      )}

      {lage === 'slaIhop' && (
        <form action={slaIhop} className="mt-4 space-y-3 border-t border-sand-200 pt-4">
          <input type="hidden" name="franId" value={onskemal.id} />
          {ihopState?.error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">
              {ihopState.error}
            </p>
          )}
          <p className="text-sm text-sand-700">
            Rösterna flyttas till posten du väljer, och <b>{onskemal.name}</b> raderas.
          </p>
          <div className="flex flex-wrap gap-2">
            <select name="tillId" className="input sm:w-80" defaultValue="">
              <option value="">Välj post att slå ihop med…</option>
              {andra.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <SubmitButton className="btn-danger">Slå ihop</SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
