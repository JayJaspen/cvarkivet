import 'server-only';
import crypto from 'crypto';

/**
 * Kontroll av lösenord mot kända dataintrång.
 *
 * Tjänsten Have I Been Pwned har en databas över lösenord som förekommit i
 * publika läckor – samma databas som Chrome och iOS varnar utifrån. Ett
 * lösenord som finns där är inte "svagt" i teknisk mening, men det ligger i de
 * ordlistor angripare provar först, och är därför i praktiken redan känt.
 *
 * Lösenordet lämnar aldrig servern. Vi hashar det med SHA-1, skickar de
 * *fem första* tecknen av hashen, och får tillbaka alla kända hashar som
 * börjar likadant – i storleksordningen några hundra. Jämförelsen görs sedan
 * lokalt. Metoden kallas k-anonymitet: mottagaren kan inte veta vilket av
 * hundratals lösenord frågan gällde, och får aldrig se lösenordet självt.
 *
 * SHA-1 används för att det är vad API:et kräver för uppslagningen. Det har
 * inget med hur vi *lagrar* lösenord att göra – det sker med bcrypt.
 */

const API = 'https://api.pwnedpasswords.com/range/';

/** Lösenord som är för uppenbara för att ens behöva slås upp. */
const UPPENBARA = [
  'password',
  'passw0rd',
  'losenord',
  'lösenord',
  'cvarkivet',
  'qwerty',
  'abc123',
  '12345678',
  '123456789',
  'welcome',
  'valkommen',
  'välkommen',
];

export type LosenordsSvar = { ok: true } | { ok: false; error: string };

/**
 * Hur många gånger lösenordet förekommer i kända läckor.
 * Returnerar null om tjänsten inte gick att nå.
 */
async function antalIKandaLackor(losenord: string): Promise<number | null> {
  const hash = crypto.createHash('sha1').update(losenord, 'utf8').digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const svar = await fetch(`${API}${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      // Hellre släppa igenom än att låsa någon ute för att ett API är segt.
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    if (!svar.ok) return null;

    const text = await svar.text();
    for (const rad of text.split('\n')) {
      const [s, antal] = rad.trim().split(':');
      if (s === suffix) return Number(antal) || 0;
    }
    return 0;
  } catch {
    // Nätverksfel, timeout eller nere tjänst. Se kommentaren i granskaLosenord.
    return null;
  }
}

/**
 * Godkänner eller underkänner ett lösenord som någon försöker sätta.
 *
 * Om Have I Been Pwned inte svarar släpper vi igenom lösenordet. Ett externt
 * API som ligger nere ska inte hindra folk från att skapa konto eller byta
 * lösenord – längdkravet och kontrollen mot uppenbara lösenord gäller ändå.
 */
export async function granskaLosenord(
  losenord: string,
  uppgifter: { epost?: string; fornamn?: string; efternamn?: string; foretag?: string } = {}
): Promise<LosenordsSvar> {
  if (losenord.length < 10)
    return { ok: false, error: 'Lösenordet måste vara minst 10 tecken.' };

  const lower = losenord.toLowerCase();

  if (UPPENBARA.some((u) => lower.includes(u)))
    return {
      ok: false,
      error: 'Lösenordet är för lätt att gissa. Undvik ord som "password" och "qwerty".',
    };

  // Lösenord som består av användarens egna uppgifter är det första en
  // angripare provar, och står inte alltid i läckdatabaserna.
  const egna = [
    uppgifter.epost?.split('@')[0],
    uppgifter.fornamn,
    uppgifter.efternamn,
    uppgifter.foretag,
  ]
    .filter((v): v is string => Boolean(v && v.length >= 3))
    .map((v) => v.toLowerCase());

  if (egna.some((v) => lower.includes(v)))
    return {
      ok: false,
      error: 'Lösenordet får inte innehålla ditt namn, din e-postadress eller företagsnamnet.',
    };

  const antal = await antalIKandaLackor(losenord);

  if (antal === null) return { ok: true };

  if (antal > 0)
    return {
      ok: false,
      error:
        `Det här lösenordet finns i kända dataintrång (${antal.toLocaleString('sv-SE')} gånger) ` +
        'och är därför lätt att knäcka. Välj ett annat – gärna tre slumpvisa ord.',
    };

  return { ok: true };
}
