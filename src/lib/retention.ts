import 'server-only';
import { prisma } from './db';
import { appUrl, retentionWarningEmail, sendEmail } from './email';

/**
 * Gallring av inaktiva konton.
 *
 * Integritetspolicyn lovar att konton som varit inaktiva i 24 månader raderas.
 * Den här modulen är det som faktiskt gör det.
 *
 * Flödet: 30 dagar innan gränsen får kandidaten ett varningsmail. Loggar hen in
 * nollställs klockan automatiskt (lastLoginAt uppdateras). Sker ingenting raderas
 * kontot med all tillhörande data när de 24 månaderna passerats.
 *
 * Företag omfattas bara om de saknar prenumeration – ett betalande företag ska
 * aldrig försvinna av misstag. Underlag för bokföring finns i ditt
 * bokföringsprogram, inte här.
 */

export const INAKTIV_MANADER = 24;
export const VARNING_DAGAR_INNAN = 30;

function manaderSedan(manader: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - manader);
  return d;
}

/** Gränsen för radering: senast aktiv före detta datum → kontot ska bort. */
export function raderingsGrans() {
  return manaderSedan(INAKTIV_MANADER);
}

/** Gränsen för varning: senast aktiv före detta datum → varning ska skickas. */
export function varningsGrans() {
  const d = manaderSedan(INAKTIV_MANADER);
  d.setDate(d.getDate() + VARNING_DAGAR_INNAN);
  return d;
}

export type GallringsResultat = {
  varnadeKandidater: number;
  raderadeKandidater: number;
  raderadeForetag: number;
  avslutadeAbonnemang: number;
  fel: string[];
};

/**
 * Avslutar uppsagda årsabonnemang som passerat sitt slutdatum.
 * Fram till dess behåller företaget åtkomsten – de har betalat för perioden.
 */
async function avslutaUtgangnaAbonnemang(torrkorning: boolean) {
  const where = {
    subscription: 'YEARLY',
    cancelledAt: { not: null },
    subscriptionEndsAt: { lt: new Date() },
  } as const;

  if (torrkorning) return prisma.company.count({ where });

  const { count } = await prisma.company.updateMany({
    where,
    data: { subscription: 'NONE', subscriptionStarted: null, subscriptionEndsAt: null },
  });
  return count;
}

/**
 * Kör hela gallringen. Anropas av cron-jobbet varje natt, men kan också
 * startas manuellt från adminvyn.
 *
 * `torrkorning` gör allt utom att skicka mail och radera – bra för att se
 * vad som skulle hända innan man låter det gå skarpt.
 */
export async function korGallring(torrkorning = false): Promise<GallringsResultat> {
  const resultat: GallringsResultat = {
    varnadeKandidater: 0,
    raderadeKandidater: 0,
    raderadeForetag: 0,
    avslutadeAbonnemang: 0,
    fel: [],
  };

  resultat.avslutadeAbonnemang = await avslutaUtgangnaAbonnemang(torrkorning);

  const raderaFore = raderingsGrans();
  const varnaFore = varningsGrans();

  // 1. Varna kandidater som närmar sig gränsen och inte redan varnats.
  //    Den som redan passerat raderingsgränsen ska inte varnas – hen raderas
  //    i steg 2 och ska inte få ett mail om något som händer sekunden efter.
  const attVarna = await prisma.user.findMany({
    where: {
      retentionWarningAt: null,
      OR: [
        { lastLoginAt: { lt: varnaFore, gte: raderaFore } },
        { lastLoginAt: null, createdAt: { lt: varnaFore, gte: raderaFore } },
      ],
    },
    select: { id: true, email: true, firstName: true, lastLoginAt: true, createdAt: true },
  });

  for (const u of attVarna) {
    const senastAktiv = u.lastLoginAt ?? u.createdAt;
    const raderasDen = new Date(senastAktiv);
    raderasDen.setMonth(raderasDen.getMonth() + INAKTIV_MANADER);
    const dagarKvar = Math.max(
      1,
      Math.ceil((raderasDen.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    );

    if (torrkorning) {
      resultat.varnadeKandidater++;
      continue;
    }

    try {
      const mail = retentionWarningEmail(u.firstName, dagarKvar, appUrl('/logga-in'));
      await sendEmail({ to: u.email, ...mail });
      await prisma.user.update({
        where: { id: u.id },
        data: { retentionWarningAt: new Date() },
      });
      resultat.varnadeKandidater++;
    } catch (err) {
      resultat.fel.push(`Kunde inte varna ${u.email}: ${String(err)}`);
    }
  }

  // 2. Radera kandidater som passerat gränsen.
  const attRadera = await prisma.user.findMany({
    where: {
      OR: [
        { lastLoginAt: { lt: raderaFore } },
        { lastLoginAt: null, createdAt: { lt: raderaFore } },
      ],
    },
    select: { id: true },
  });

  if (!torrkorning && attRadera.length > 0) {
    const { count } = await prisma.user.deleteMany({
      where: { id: { in: attRadera.map((u) => u.id) } },
    });
    resultat.raderadeKandidater = count;
  } else {
    resultat.raderadeKandidater = attRadera.length;
  }

  // 3. Radera företagskonton utan prenumeration som passerat gränsen.
  //    Pilotkunder undantas: de har full åtkomst och är kunder i allt utom
  //    faktureringen, så de ska inte gallras bort som övergivna konton.
  const foretagAttRadera = await prisma.company.findMany({
    where: {
      subscription: 'NONE',
      isPilot: false,
      OR: [
        { lastLoginAt: { lt: raderaFore } },
        { lastLoginAt: null, createdAt: { lt: raderaFore } },
      ],
    },
    select: { id: true },
  });

  if (!torrkorning && foretagAttRadera.length > 0) {
    const { count } = await prisma.company.deleteMany({
      where: { id: { in: foretagAttRadera.map((c) => c.id) } },
    });
    resultat.raderadeForetag = count;
  } else {
    resultat.raderadeForetag = foretagAttRadera.length;
  }

  return resultat;
}

/** Siffror till adminvyn – hur många är varnade respektive på väg att raderas. */
export async function gallringsStatus() {
  const raderaFore = raderingsGrans();
  const varnaFore = varningsGrans();

  const [varnade, straxRaderade, foretagStraxRaderade] = await Promise.all([
    prisma.user.count({ where: { retentionWarningAt: { not: null } } }),
    prisma.user.count({
      where: {
        OR: [
          { lastLoginAt: { lt: varnaFore, gte: raderaFore } },
          { lastLoginAt: null, createdAt: { lt: varnaFore, gte: raderaFore } },
        ],
      },
    }),
    prisma.company.count({
      where: {
        subscription: 'NONE',
        OR: [
          { lastLoginAt: { lt: raderaFore } },
          { lastLoginAt: null, createdAt: { lt: raderaFore } },
        ],
      },
    }),
  ]);

  return { varnade, straxRaderade, foretagStraxRaderade };
}

/**
 * Håller lastLoginAt aktuell medan kandidaten använder sidan, som mest en
 * skrivning per dygn. Utan detta skulle någon som är inloggad hela tiden
 * felaktigt räknas som inaktiv.
 */
export function registreraAktivitet(user: {
  id: string;
  lastLoginAt: Date | null;
  retentionWarningAt: Date | null;
}) {
  const ettDygnSedan = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (user.lastLoginAt && user.lastLoginAt > ettDygnSedan && !user.retentionWarningAt) return;

  // Medvetet inte inväntad: sidan ska inte behöva vänta på en skrivning som
  // bara håller gallringsklockan aktuell. Misslyckas den görs ett nytt försök
  // vid nästa sidvisning.
  void prisma.user
    .update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), retentionWarningAt: null },
    })
    .catch((err) => console.error('Kunde inte uppdatera senaste aktivitet:', err));
}
