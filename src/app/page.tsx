import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Logo } from '@/components/ui';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();
  if (session?.role === 'USER') redirect('/kandidat/jobb');
  if (session?.role === 'COMPANY') redirect('/foretag/cvarkivet');
  if (session?.role === 'ADMIN') redirect('/admin/anvandare');

  const [users, companies, ads] = await Promise.all([
    prisma.user.count({ where: { suspended: false } }),
    prisma.company.count({ where: { suspended: false, status: 'APPROVED' } }),
    prisma.jobAd.count({
      where: {
        deadline: { gte: new Date() },
        company: { suspended: false, status: 'APPROVED' },
      },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/logga-in" className="btn-secondary">
              Logga in
            </Link>
            <Link href="/registrera" className="btn-primary">
              Skapa konto
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-600">
            Gratis för dig som söker jobb
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Lägg upp ditt CV en gång – låt företagen hitta dig
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            På CVArkivet.se skapar du en profil gratis och bestämmer själv vilka företag som får se
            den. Företag söker bland kandidater och publicerar lediga jobb.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/registrera/anvandare" className="btn-primary px-6 py-3 text-base">
              Skapa CV gratis
            </Link>
            <Link href="/registrera/foretag" className="btn-secondary px-6 py-3 text-base">
              Registrera företag
            </Link>
          </div>

          <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4">
            {[
              { n: users, l: 'Registrerade kandidater' },
              { n: companies, l: 'Anslutna företag' },
              { n: ads, l: 'Aktiva annonser' },
            ].map((s) => (
              <div key={s.l} className="card">
                <dt className="text-3xl font-bold text-brand-600">{s.n}</dt>
                <dd className="muted mt-1">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h2 className="h2">För dig som söker jobb</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>✓ Helt gratis, kontot är aktivt direkt</li>
              <li>✓ Bläddra bland lediga jobb och filtrera på kommun och kategori</li>
              <li>✓ Dölj din profil för din nuvarande arbetsgivare</li>
              <li>✓ Se exakt vilka företag som har läst ditt CV</li>
              <li>✓ Välj distansjobb och flera kommuner samtidigt</li>
            </ul>
            <Link href="/registrera/anvandare" className="btn-primary mt-6">
              Skapa mitt CV
            </Link>
          </div>

          <div className="card">
            <h2 className="h2">För arbetsgivare</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>✓ Kontot är gratis – prenumeration aktiveras i efterhand</li>
              <li>✓ Sök i hela CV-arkivet, filtrera på kommun och kategori</li>
              <li>✓ Hjärta intressanta kandidater och kontakta dem direkt</li>
              <li>✓ Publicera annonser med sista ansökningsdag</li>
            </ul>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-semibold">CV-prenumeration</p>
                <p className="mt-1 text-2xl font-bold text-brand-600">
                  299 kr
                  <span className="text-sm font-normal text-slate-500">/mån exkl. moms</span>
                </p>
                <p className="muted mt-1">Tillgång till CVArkivet.</p>
              </div>
              <div className="rounded-lg border-2 border-brand-500 p-4">
                <p className="text-sm font-semibold">CV + Annonspaket</p>
                <p className="mt-1 text-2xl font-bold text-brand-600">
                  499 kr
                  <span className="text-sm font-normal text-slate-500">/mån exkl. moms</span>
                </p>
                <p className="muted mt-1">CVArkivet + egna annonser.</p>
              </div>
            </div>
            <Link href="/registrera/foretag" className="btn-primary mt-6">
              Registrera företag
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} CVArkivet.se</p>
          <div className="flex gap-4">
            <Link href="/villkor" className="hover:text-slate-900">
              Användarvillkor
            </Link>
            <Link href="/integritetspolicy" className="hover:text-slate-900">
              Integritetspolicy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
