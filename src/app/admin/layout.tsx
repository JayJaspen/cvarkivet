import Nav from '@/components/Nav';
import { requireAdmin } from '@/lib/session';
import { logout } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav
        name={admin.name}
        role="Administratör"
        logoutAction={logout}
        tabs={[
          { href: '/admin/anvandare', label: 'Registrerade användare' },
          { href: '/admin/foretag', label: 'Registrerade företag' },
          { href: '/admin/mitt-konto', label: 'Mitt konto' },
        ]}
      />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
