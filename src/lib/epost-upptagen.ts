import 'server-only';
import { prisma } from './db';

/**
 * Är e-postadressen redan använd av något konto i systemet?
 *
 * Alla tre kontotyper måste kollas, inte bara kandidat och företag.
 * Inloggningen provar admin först, sedan kandidat, sedan företag – så ett
 * kandidatkonto med samma adress som ett adminkonto blir omöjligt att nå.
 * Kontot finns kvar, men användaren hamnar alltid i adminvyn.
 *
 * `utomEgenId` gör att man kan spara sin egen profil utan att kollidera med
 * sig själv när adressen är oförändrad.
 */
export async function epostUpptagen(
  epost: string,
  utomEgenId?: { userId?: string; companyId?: string }
): Promise<boolean> {
  const [user, company, admin] = await Promise.all([
    prisma.user.findUnique({ where: { email: epost }, select: { id: true } }),
    prisma.company.findUnique({ where: { email: epost }, select: { id: true } }),
    prisma.admin.findUnique({ where: { email: epost }, select: { id: true } }),
  ]);

  if (admin) return true;
  if (user && user.id !== utomEgenId?.userId) return true;
  if (company && company.id !== utomEgenId?.companyId) return true;
  return false;
}
