import 'server-only';
import { prisma } from './db';
import { appUrl, cvViewedEmail, sendEmail } from './email';

const EN_DAG = 24 * 60 * 60 * 1000;

/**
 * Loggar att ett företag öppnat ett CV och mailar kandidaten.
 *
 * Notisen skickas som mest en gång per dygn och företag, så att en rekryterare
 * som klickar fram och tillbaka inte spammar kandidaten. Kandidaten kan stänga
 * av notiserna helt under Min sida.
 */
export async function logCvView(
  company: { id: string; name: string },
  user: { id: string; firstName: string; email: string; notifyOnCvView: boolean }
) {
  // Visningen loggas i bakgrunden. Företaget ska inte vänta på skrivningen,
  // och kandidatens statistik behöver inte vara uppdaterad på millisekunden.
  void prisma.cvView
    .create({ data: { companyId: company.id, userId: user.id } })
    .catch((err) => console.error('Kunde inte logga CV-visning:', err));

  if (!user.notifyOnCvView) return;

  const senaste = await prisma.cvViewNotification.findUnique({
    where: { companyId_userId: { companyId: company.id, userId: user.id } },
  });

  if (senaste && Date.now() - senaste.sentAt.getTime() < EN_DAG) return;

  await prisma.cvViewNotification.upsert({
    where: { companyId_userId: { companyId: company.id, userId: user.id } },
    create: { companyId: company.id, userId: user.id },
    update: { sentAt: new Date() },
  });

  const mail = cvViewedEmail(user.firstName, company.name, appUrl('/kandidat/min-sida'));
  await sendEmail({ to: user.email, ...mail });
}
