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
