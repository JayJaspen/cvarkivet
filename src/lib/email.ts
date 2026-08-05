import 'server-only';
import { SUPPORT_EPOST } from './data';

/**
 * Utskick av transaktionsmail via Resend.
 *
 * Saknas RESEND_API_KEY loggas mailet till konsolen i stället för att skickas.
 * Det gör att hela appen fungerar lokalt utan e-postkonto – och att inga mail
 * råkar gå iväg under utveckling.
 */

const FROM = process.env.EMAIL_FROM || 'CVArkivet <no-reply@cvarkivet.se>';
const KEY = process.env.RESEND_API_KEY;

export function appUrl(pathname = '') {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return `${base.replace(/\/$/, '')}${pathname}`;
}

type Mail = { to: string; subject: string; html: string; text: string };

export async function sendEmail({ to, subject, html, text }: Mail) {
  if (!KEY) {
    console.log(`\n[E-POST – ej skickat, RESEND_API_KEY saknas]\nTill: ${to}\nÄmne: ${subject}\n${text}\n`);
    return { sent: false as const };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
    });

    if (!res.ok) {
      console.error('Resend-fel:', res.status, await res.text());
      return { sent: false as const };
    }
    return { sent: true as const };
  } catch (err) {
    console.error('Kunde inte skicka e-post:', err);
    return { sent: false as const };
  }
}

// ------------------------------------------------------------------- Mallar

function layout(heading: string, body: string, cta?: { url: string; label: string }) {
  return `<!doctype html>
<html lang="sv"><body style="margin:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <p style="font-size:18px;font-weight:600;margin:0 0 24px">CVArkivet<span style="color:#3366ff">.se</span></p>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
      <div style="font-size:15px;line-height:1.6;color:#334155">${body}</div>
      ${
        cta
          ? `<p style="margin:24px 0 0"><a href="${cta.url}" style="display:inline-block;background:#1f47f5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:15px">${cta.label}</a></p>`
          : ''
      }
    </div>
    <p style="font-size:12px;color:#94a3b8;margin-top:20px">
      Det här mailet skickades av CVArkivet.se. Svara inte på det här meddelandet.
    </p>
  </div>
</body></html>`;
}

export function passwordResetEmail(name: string, url: string) {
  return {
    subject: 'Återställ ditt lösenord på CVArkivet',
    html: layout(
      `Hej ${name}!`,
      `<p>Du har begärt att återställa ditt lösenord. Klicka på knappen nedan för att välja ett nytt. Länken gäller i 60 minuter.</p>
       <p style="color:#64748b;font-size:13px">Om du inte begärt detta kan du ignorera mailet – ditt lösenord ändras inte.</p>`,
      { url, label: 'Välj nytt lösenord' }
    ),
    text: `Hej ${name}!\n\nÅterställ ditt lösenord här (länken gäller i 60 minuter):\n${url}\n\nOm du inte begärt detta kan du ignorera mailet.`,
  };
}

export function companyApprovedEmail(contactName: string, companyName: string, url: string) {
  return {
    subject: `${companyName} är nu godkänt på CVArkivet`,
    html: layout(
      `Hej ${contactName}!`,
      `<p>Vi har granskat er registrering och <strong>${companyName}</strong> är nu godkänt
        på CVArkivet.</p>
       <p>Nästa steg är att aktivera en prenumeration under fliken <em>Vår sida</em>.
        Därefter kan ni söka bland kandidaternas CV.</p>
       <ul style="padding-left:18px">
         <li>CV-prenumeration – 299 kr/mån exkl. moms</li>
         <li>CV + Annonspaket – 499 kr/mån exkl. moms</li>
       </ul>`,
      { url, label: 'Logga in och kom igång' }
    ),
    text: `Hej ${contactName}!\n\n${companyName} är nu godkänt på CVArkivet.\n\nAktivera en prenumeration under Vår sida så kommer ni åt CVArkivet:\n- CV-prenumeration 299 kr/mån exkl. moms\n- CV + Annonspaket 499 kr/mån exkl. moms\n\nLogga in: ${url}`,
  };
}

export function companyRejectedEmail(
  contactName: string,
  companyName: string,
  motivering: string
) {
  return {
    subject: `Angående er registrering på CVArkivet`,
    html: layout(
      `Hej ${contactName}!`,
      `<p>Vi har granskat registreringen av <strong>${companyName}</strong> och kan tyvärr
        inte godkänna kontot.</p>
       ${motivering ? `<p><strong>Motivering:</strong><br>${motivering}</p>` : ''}
       <p>Tror ni att det blivit fel, svara gärna till ${SUPPORT_EPOST} så tittar vi
        på det igen.</p>`
    ),
    text: `Hej ${contactName}!\n\nVi har granskat registreringen av ${companyName} och kan tyvärr inte godkänna kontot.\n\n${motivering ? `Motivering: ${motivering}\n\n` : ''}Tror ni att det blivit fel, hör av er till ${SUPPORT_EPOST}.`,
  };
}

export function newCompanyForReviewEmail(
  companyName: string,
  orgNumber: string,
  email: string,
  url: string
) {
  return {
    subject: `Nytt företag att granska: ${companyName}`,
    html: layout(
      'Ett företag väntar på granskning',
      `<p><strong>${companyName}</strong> har registrerat sig och väntar på godkännande.</p>
       <p>Organisationsnummer: ${orgNumber}<br>Kontakt: ${email}</p>`,
      { url, label: 'Granska företaget' }
    ),
    text: `${companyName} har registrerat sig och väntar på godkännande.\n\nOrganisationsnummer: ${orgNumber}\nKontakt: ${email}\n\nGranska: ${url}`,
  };
}

export function retentionWarningEmail(name: string, dagar: number, url: string) {
  return {
    subject: `Ditt konto på CVArkivet raderas om ${dagar} dagar`,
    html: layout(
      `Hej ${name}!`,
      `<p>Du har inte använt CVArkivet på snart två år. Enligt vår integritetspolicy
        raderar vi konton som varit inaktiva i 24 månader – vi sparar inte uppgifter
        längre än nödvändigt.</p>
       <p><strong>Ditt konto och ditt CV raderas om ${dagar} dagar.</strong></p>
       <p>Vill du behålla kontot behöver du bara logga in. Då nollställs klockan och
        du hör inte av oss igen på länge.</p>
       <p style="color:#64748b;font-size:13px">Vill du inte behålla kontot behöver du
        inte göra någonting. Raderingen sker automatiskt.</p>`,
      { url, label: 'Logga in och behåll kontot' }
    ),
    text: `Hej ${name}!\n\nDu har inte använt CVArkivet på snart två år. Enligt vår integritetspolicy raderar vi konton som varit inaktiva i 24 månader.\n\nDitt konto och ditt CV raderas om ${dagar} dagar.\n\nVill du behålla kontot loggar du bara in:\n${url}\n\nVill du inte behålla det behöver du inte göra någonting.`,
  };
}

export function cvViewedEmail(name: string, companyName: string, url: string) {
  return {
    subject: `${companyName} har läst ditt CV`,
    html: layout(
      `Hej ${name}!`,
      `<p><strong>${companyName}</strong> har öppnat och läst ditt CV på CVArkivet.</p>
       <p>Du kan se alla företag som läst din profil under <em>Min sida</em>. Där kan du också stänga av de här notiserna.</p>`,
      { url, label: 'Se din statistik' }
    ),
    text: `Hej ${name}!\n\n${companyName} har läst ditt CV på CVArkivet.\n\nSe din statistik: ${url}\n\nDu kan stänga av notiserna under Min sida.`,
  };
}
