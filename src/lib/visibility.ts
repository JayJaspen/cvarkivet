import 'server-only';
import { prisma } from './db';
import { domainOf } from './utils';

/**
 * Alla användar-id som ska vara osynliga för ett visst företag.
 * Två spärrar: användaren har dolt sig för företaget direkt, eller
 * dolt sig för företagets e-postdomän (t.ex. alla @ab.se-konton).
 */
export async function hiddenUserIdsForCompany(company: { id: string; email: string }) {
  const domain = domainOf(company.email);

  const [byCompany, byDomain] = await Promise.all([
    prisma.hiddenCompany.findMany({
      where: { companyId: company.id },
      select: { userId: true },
    }),
    domain
      ? prisma.hiddenDomain.findMany({
          where: { domain },
          select: { userId: true },
        })
      : Promise.resolve([] as { userId: string }[]),
  ]);

  return Array.from(new Set([...byCompany, ...byDomain].map((r) => r.userId)));
}

/** Är just den här användaren dold för det här företaget? */
export async function isUserHiddenFrom(userId: string, company: { id: string; email: string }) {
  const domain = domainOf(company.email);
  const [c, d] = await Promise.all([
    prisma.hiddenCompany.findUnique({
      where: { userId_companyId: { userId, companyId: company.id } },
    }),
    domain
      ? prisma.hiddenDomain.findUnique({ where: { userId_domain: { userId, domain } } })
      : Promise.resolve(null),
  ]);
  return Boolean(c || d);
}
