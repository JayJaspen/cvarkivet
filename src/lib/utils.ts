/** Plockar ut domändelen ur en e-postadress: "anna@ab.se" -> "ab.se" */
export function domainOf(email: string): string {
  return email.trim().toLowerCase().split('@').pop() ?? '';
}

/** Normaliserar en domän som användaren skrivit in: "@AB.se", "www.ab.se" -> "ab.se" */
export function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

export function ageFromBirthDate(birthDate: string): number | null {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(birthDate.replace(/\D/g, ''));
  if (!m) return null;
  const [, y, mo, d] = m;
  const bd = new Date(Number(y), Number(mo) - 1, Number(d));
  if (Number.isNaN(bd.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - bd.getFullYear();
  const before =
    now.getMonth() < bd.getMonth() ||
    (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate());
  if (before) age--;
  return age >= 0 && age < 120 ? age : null;
}

export function validBirthDate(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  return ageFromBirthDate(digits) === null ? null : digits;
}

export function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Gratis e-posttjänster för privatpersoner. Företag måste registrera sig med en
 * företagsdomän – det gör det svårare att lägga upp låtsasföretag och gör att
 * kandidaternas domänblockering faktiskt fungerar.
 *
 * Gäller ENDAST företagsregistrering. Kandidater får använda vad de vill.
 */
export const PRIVATA_EPOSTDOMANER = new Set([
  // Internationella
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.se', 'hotmail.co.uk', 'hotmail.fr',
  'outlook.com', 'outlook.se', 'live.com', 'live.se', 'msn.com',
  'yahoo.com', 'yahoo.se', 'yahoo.co.uk', 'ymail.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'gmx.com', 'gmx.de', 'gmx.se',
  'protonmail.com', 'proton.me', 'pm.me',
  'mail.com', 'zoho.com', 'fastmail.com', 'tutanota.com',
  'yandex.com', 'yandex.ru', 'inbox.com',
  // Svenska internetleverantörer och portaler
  'telia.com', 'telia.se', 'comhem.se', 'bredband.net', 'bredband2.com',
  'tele2.se', 'spray.se', 'passagen.se', 'swipnet.se', 'home.se',
  'glocalnet.se', 'bahnhof.se', 'algonet.se', 'chello.se', 'tre.se',
  // Engångsadresser
  'mailinator.com', 'guerrillamail.com', 'temp-mail.org', '10minutemail.com',
  'throwawaymail.com', 'yopmail.com', 'trashmail.com', 'sharklasers.com',
]);

export function arPrivatEpostdoman(email: string) {
  return PRIVATA_EPOSTDOMANER.has(domainOf(email));
}

/**
 * Kontrollerar ett svenskt organisationsnummer med Luhn-algoritmen.
 * Sista siffran är en kontrollsiffra som räknas fram ur de nio första,
 * så påhittade nummer avvisas.
 */
export function giltigtOrgnummer(raw: string): string | null {
  let siffror = raw.replace(/\D/g, '');

  // Vissa skriver med sekelprefix, t.ex. 165566778899
  if (siffror.length === 12 && (siffror.startsWith('16') || siffror.startsWith('18')))
    siffror = siffror.slice(2);

  if (siffror.length !== 10) return null;

  // Tredje siffran ska vara minst 2 för juridiska personer –
  // annars är det ett personnummer, och enskilda firmor använder sitt eget.
  let summa = 0;
  for (let i = 0; i < 10; i++) {
    let n = Number(siffror[i]);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    summa += n;
  }
  if (summa % 10 !== 0) return null;

  return `${siffror.slice(0, 6)}-${siffror.slice(6)}`;
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return '–';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('sv-SE');
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return '–';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
}

export function kr(n: number | null | undefined) {
  if (n === null || n === undefined) return '–';
  return n.toLocaleString('sv-SE') + ' kr';
}

export function monthsFromNow(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}
