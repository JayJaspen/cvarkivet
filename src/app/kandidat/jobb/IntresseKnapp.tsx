'use client';

import { useState } from 'react';
import { taBortIntresse, visaIntresse } from '@/app/actions/user';
import SubmitButton from '@/components/SubmitButton';

/**
 * Låter kandidaten signalera intresse för en tjänst utan att skicka en formell
 * ansökan. Företaget ser anmälan och tar kontakt själv.
 */
export default function IntresseKnapp({
  jobAdId,
  foretagsnamn,
  anmalt,
  dold,
}: {
  jobAdId: string;
  foretagsnamn: string;
  anmalt: boolean;
  dold: boolean;
}) {
  const [oppen, setOppen] = useState(false);

  if (anmalt)
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-sm font-medium text-emerald-800">Du har anmält intresse</p>
        <p className="mt-1 text-xs text-emerald-700">
          {foretagsnamn} ser din anmälan och kan höra av sig.
        </p>
        <form action={taBortIntresse} className="mt-2">
          <input type="hidden" name="jobAdId" value={jobAdId} />
          <button className="text-xs text-red-600 hover:underline" type="submit">
            Ta tillbaka anmälan
          </button>
        </form>
      </div>
    );

  if (!oppen)
    return (
      <button type="button" onClick={() => setOppen(true)} className="btn-primary">
        Visa intresse
      </button>
    );

  return (
    <form action={visaIntresse} className="space-y-2 rounded-lg border border-sand-200 p-3">
      <input type="hidden" name="jobAdId" value={jobAdId} />

      <p className="text-sm font-medium text-sand-900">Visa intresse</p>
      <p className="text-xs text-sand-600">
        {foretagsnamn} får se ditt CV och kan kontakta dig. Du skickar ingen ansökan.
      </p>

      {dold && (
        <p className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
          Obs: du har dolt din profil för {foretagsnamn}. Anmäler du intresse blir den synlig
          för dem.
        </p>
      )}

      <textarea
        name="message"
        rows={3}
        placeholder="Vill du skriva några rader? (frivilligt)"
        className="input text-sm"
      />

      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingText="Skickar…">Skicka</SubmitButton>
        <button type="button" onClick={() => setOppen(false)} className="btn-secondary">
          Avbryt
        </button>
      </div>
    </form>
  );
}
