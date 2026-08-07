import Nav from '@/components/Nav';
import { requireAdmin } from '@/lib/session';
import { logout } from '@/app/actions/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  const [attGranska, onskemalAttGranska] = await Promise.all([
    prisma.company.count({ where: { status: 'PENDING' } }),
    prisma.companyWish.count({ where: { status: 'PENDING', fulfilledAt: null } }),
  ]);

  return (
    <div className="min-h-screen">
      <Nav
        name={admin.name}
        role="Administratör"
        logoutAction={logout}
        tabs={[
          { href: '/admin/anvandare', label: 'Registrerade användare' },
          { href: '/admin/foretag', label: 'Registrerade företag', badge: attGranska },
          { href: '/admin/topplista', label: 'Topplista' },
          { href: '/admin/onskelista', label: 'Önskelistan', badge: onskemalAttGranska },
          { href: '/admin/ai', label: 'AI-förbrukning' },
          { href: '/admin/installningar', label: 'Inställningar' },
          { href: '/admin/mitt-konto', label: 'Mitt konto' },
        ]}
      />
      <main className="px-4 py-8 md:ml-64 md:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
