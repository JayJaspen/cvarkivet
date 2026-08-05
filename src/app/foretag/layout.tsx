import Nav from '@/components/Nav';
import { requireCompany } from '@/lib/session';
import { logout } from '@/app/actions/auth';
import { prisma } from '@/lib/db';
import { planNamnFor } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ForetagLayout({ children }: { children: React.ReactNode }) {
  const company = await requireCompany();

  const [unread, nyaIntressen] = await Promise.all([
    prisma.message.count({
      where: { companyId: company.id, senderType: 'USER', readAt: null },
    }),
    prisma.interest.count({
      where: { viewedAt: null, jobAd: { companyId: company.id } },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav
        name={company.name}
        role={planNamnFor(company.subscription, company.companyType)}
        logoutAction={logout}
        tabs={[
          { href: '/foretag/cvarkivet', label: 'CVArkivet' },
          { href: '/foretag/annonser', label: 'Annonser', badge: nyaIntressen },
          { href: '/foretag/var-sida', label: 'Vår sida' },
          { href: '/foretag/meddelanden', label: 'Meddelanden', badge: unread },
        ]}
      />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
