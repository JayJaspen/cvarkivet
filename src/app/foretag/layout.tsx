import Nav from '@/components/Nav';
import { requireCompany } from '@/lib/session';
import { logout } from '@/app/actions/auth';
import { prisma } from '@/lib/db';
import { planNamn } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ForetagLayout({ children }: { children: React.ReactNode }) {
  const company = await requireCompany();

  const unread = await prisma.message.count({
    where: { companyId: company.id, senderType: 'USER', readAt: null },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav
        name={company.name}
        role={planNamn(company.subscription)}
        logoutAction={logout}
        tabs={[
          { href: '/foretag/cvarkivet', label: 'CVArkivet' },
          { href: '/foretag/annonser', label: 'Annonser' },
          { href: '/foretag/var-sida', label: 'Vår sida' },
          { href: '/foretag/meddelanden', label: 'Meddelanden', badge: unread },
        ]}
      />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
