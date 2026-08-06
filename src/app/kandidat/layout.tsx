import Nav from '@/components/Nav';
import { requireUser } from '@/lib/session';
import { logout } from '@/app/actions/auth';
import { prisma } from '@/lib/db';
import { registreraAktivitet } from '@/lib/retention';

export const dynamic = 'force-dynamic';

export default async function KandidatLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // Räknas som aktiv så länge sidan används – annars skulle en inloggad
  // kandidat kunna gallras bort trots att hen är kvar. Skrivningen inväntas inte.
  registreraAktivitet(user);

  const unread = await prisma.message.count({
    where: { userId: user.id, senderType: 'COMPANY', readAt: null },
  });

  return (
    <div className="min-h-screen">
      <Nav
        name={`${user.firstName} ${user.lastName}`}
        role="Kandidat"
        logoutAction={logout}
        tabs={[
          { href: '/kandidat/jobb', label: 'Lediga jobb' },
          { href: '/kandidat/foretag', label: 'Registrerade företag' },
          { href: '/kandidat/topplista', label: 'Topplista' },
          { href: '/kandidat/onskelista', label: 'Önska företag' },
          { href: '/kandidat/cv', label: 'Mitt CV' },
          { href: '/kandidat/min-sida', label: 'Min sida' },
          { href: '/kandidat/meddelanden', label: 'Meddelanden', badge: unread },
        ]}
      />
      <main className="px-4 py-8 md:ml-64 md:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
