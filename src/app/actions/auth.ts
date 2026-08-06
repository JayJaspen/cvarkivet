'use server';

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createSession, destroySession } from '@/lib/session';
import { epostUpptagen } from '@/lib/epost-upptagen';
import {
  validBirthDate,
  validEmail,
  normalizeDomain,
  arPrivatEpostdoman,
  giltigtOrgnummer,
} from '@/lib/utils';
import {
  appUrl,
  newCompanyForReviewEmail,
  passwordResetEmail,
  sendEmail,
} from '@/lib/email';
import { SUPPORT_EPOST } from '@/lib/data';
import { markeraOnskemalSomUppfyllt } from '@/lib/onskelista';

export type FormState = { error?: string; ok?: string } | undefined;

// ------------------------------------------------------------------- Logga in

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');

  if (!email || !password) return { error: 'Fyll i både e-postadress och lösenord.' };

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (admin && (await bcrypt.compare(password, admin.passwordHash))) {
    await createSession(admin.id, 'ADMIN');
    redirect('/admin/anvandare');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    if (user.suspended) return { error: `Kontot är avstängt. Kontakta ${SUPPORT_EPOST}.` };
    // Inloggning nollställer klockan för gallring av inaktiva konton.
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), retentionWarningAt: null },
    });
    await createSession(user.id, 'USER');
    redirect('/kandidat/jobb');
  }

  const company = await prisma.company.findUnique({ where: { email } });
  if (company && (await bcrypt.compare(password, company.passwordHash))) {
    if (company.suspended) return { error: `Kontot är avstängt. Kontakta ${SUPPORT_EPOST}.` };
    await prisma.company.update({
      where: { id: company.id },
      data: { lastLoginAt: new Date(), retentionWarningAt: null },
    });
    await createSession(company.id, 'COMPANY');
    redirect('/foretag/cvarkivet');
  }

  return { error: 'Fel e-postadress eller lösenord.' };
}

export async function logout() {
  destroySession();
  redirect('/');
}

// ------------------------------------------------------- Registrera användare

export async function registerUser(_prev: FormState, form: FormData): Promise<FormState> {
  const firstName = String(form.get('firstName') ?? '').trim();
  const lastName = String(form.get('lastName') ?? '').trim();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const phone = String(form.get('phone') ?? '').trim();
  const birthRaw = String(form.get('birthDate') ?? '');
  const password = String(form.get('password') ?? '');
  const password2 = String(form.get('password2') ?? '');
  const terms = form.get('terms');

  if (!firstName || !lastName) return { error: 'Fyll i för- och efternamn.' };
  if (!validEmail(email)) return { error: 'Ange en giltig e-postadress.' };
  if (phone.replace(/\D/g, '').length < 6) return { error: 'Ange ett giltigt telefonnummer.' };

  const birthDate = validBirthDate(birthRaw);
  if (!birthDate) return { error: 'Ange födelsedatum som ÅÅÅÅMMDD, t.ex. 19900115.' };

  if (password.length < 8) return { error: 'Lösenordet måste vara minst 8 tecken.' };
  if (password !== password2) return { error: 'Lösenorden matchar inte.' };
  if (!terms) return { error: 'Du behöver godkänna användarvillkoren.' };

  if (await epostUpptagen(email)) return { error: 'E-postadressen är redan registrerad.' };

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  // Kontot är aktivt direkt – ingen verifiering krävs.
  await createSession(user.id, 'USER');
  redirect('/kandidat/cv?valkommen=1');
}

// --------------------------------------------------------- Registrera företag

export async function registerCompany(_prev: FormState, form: FormData): Promise<FormState> {
  const orgNumber = String(form.get('orgNumber') ?? '').trim();
  const name = String(form.get('name') ?? '').trim();
  const contactName = String(form.get('contactName') ?? '').trim();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const phone = String(form.get('phone') ?? '').trim();
  const address = String(form.get('address') ?? '').trim();
  const municipality = String(form.get('municipality') ?? '').trim();
  const website = normalizeDomain(String(form.get('website') ?? ''));
  const companyTypeRaw = String(form.get('companyType') ?? '');
  const companyType = companyTypeRaw === 'AGENCY' ? 'AGENCY' : 'EMPLOYER';
  const password = String(form.get('password') ?? '');
  const password2 = String(form.get('password2') ?? '');
  const terms = form.get('terms');

  const orgnr = giltigtOrgnummer(orgNumber);
  if (!orgnr)
    return {
      error:
        'Organisationsnumret är inte giltigt. Kontrollera att du skrivit rätt – ' +
        'formatet är 556677-8899 och sista siffran är en kontrollsiffra.',
    };

  if (!companyTypeRaw) return { error: 'Ange vilken typ av verksamhet ni är.' };
  if (!name) return { error: 'Ange företagsnamn.' };
  if (!contactName) return { error: 'Ange namn på kontaktperson.' };
  if (!validEmail(email)) return { error: 'Ange en giltig e-postadress.' };

  if (arPrivatEpostdoman(email))
    return {
      error:
        'Använd företagets egen e-postadress, inte en privat adress som Gmail eller ' +
        `Hotmail. Har ni ingen företagsdomän, kontakta ${SUPPORT_EPOST}.`,
    };

  if (phone.replace(/\D/g, '').length < 6) return { error: 'Ange ett giltigt telefonnummer.' };
  if (!address) return { error: 'Ange adress.' };
  if (!municipality) return { error: 'Välj hemmahörande kommun.' };
  if (password.length < 8) return { error: 'Lösenordet måste vara minst 8 tecken.' };
  if (password !== password2) return { error: 'Lösenorden matchar inte.' };
  if (!terms) return { error: 'Du behöver godkänna användarvillkoren.' };

  const orgTaken = await prisma.company.findUnique({ where: { orgNumber: orgnr } });
  if (orgTaken) return { error: 'Organisationsnumret är redan registrerat.' };

  if (await epostUpptagen(email)) return { error: 'E-postadressen är redan registrerad.' };

  // Karensregeln togs bort i augusti 2026. Den fanns för att hindra företag
  // från att hoppa mellan månads- och årsabonnemang; med ett enda årsabonnemang
  // finns inget att utnyttja, och ett år är i sig en lång bindning.

  const company = await prisma.company.create({
    data: {
      orgNumber: orgnr,
      companyType,
      name,
      contactName,
      email,
      phone,
      address,
      municipality,
      website: website || null,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  // Fanns företaget på önskelistan? Då lämnar de listan nu.
  await markeraOnskemalSomUppfyllt(company.id, name);

  // Meddela administratörerna att det finns något att granska.
  const admins = await prisma.admin.findMany({ select: { email: true } });
  const notis = newCompanyForReviewEmail(
    name,
    orgnr,
    email,
    appUrl(`/admin/foretag/${company.id}`)
  );
  for (const a of admins) await sendEmail({ to: a.email, ...notis });

  await createSession(company.id, 'COMPANY');
  redirect('/foretag/var-sida?valkommen=1');
}

// ------------------------------------------------------ Glömt lösenord

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export async function requestPasswordReset(
  _prev: FormState,
  form: FormData
): Promise<FormState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!validEmail(email)) return { error: 'Ange en giltig e-postadress.' };

  const user = await prisma.user.findUnique({ where: { email } });
  const company = user ? null : await prisma.company.findUnique({ where: { email } });

  // Samma svar oavsett om kontot finns – annars går det att kartlägga
  // vilka adresser som är registrerade.
  const account = user
    ? { id: user.id, role: 'USER' as const, name: user.firstName, suspended: user.suspended }
    : company
      ? {
          id: company.id,
          role: 'COMPANY' as const,
          name: company.contactName,
          suspended: company.suspended,
        }
      : null;

  if (account && !account.suspended) {
    const token = crypto.randomBytes(32).toString('hex');

    await prisma.$transaction([
      // Äldre länkar för samma konto ska sluta gälla.
      prisma.passwordResetToken.deleteMany({
        where: { accountId: account.id, usedAt: null },
      }),
      prisma.passwordResetToken.create({
        data: {
          tokenHash: hashToken(token),
          accountId: account.id,
          role: account.role,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      }),
    ]);

    const mail = passwordResetEmail(account.name, appUrl(`/aterstall-losenord?token=${token}`));
    await sendEmail({ to: email, ...mail });
  }

  return {
    ok: 'Om adressen finns registrerad har vi skickat en återställningslänk. Kolla även skräpposten.',
  };
}

export async function resetPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get('token') ?? '');
  const password = String(form.get('password') ?? '');
  const password2 = String(form.get('password2') ?? '');

  if (password.length < 8) return { error: 'Lösenordet måste vara minst 8 tecken.' };
  if (password !== password2) return { error: 'Lösenorden matchar inte.' };

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date())
    return { error: 'Länken är ogiltig eller har gått ut. Begär en ny återställning.' };

  const passwordHash = await bcrypt.hash(password, 10);

  if (record.role === 'USER') {
    await prisma.user.update({ where: { id: record.accountId }, data: { passwordHash } });
  } else {
    await prisma.company.update({ where: { id: record.accountId }, data: { passwordHash } });
  }

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  redirect('/logga-in?aterstallt=1');
}
