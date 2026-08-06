import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Logo } from '@/components/ui';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hamtaOnskelista } from '@/lib/onskelista';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();
  if (session?.role === 'USER') redirect('/kandidat/jobb');
  if (session?.role === 'COMPANY') redirect('/foretag/cvarkivet');
  if (session?.role === 'ADMIN') redirect('/admin/anvandare');

  const [users, companies, ads, onskade] = await Promise.all([
    prisma.user.count({ where: { suspended: false } }),
    prisma.company.count({ where: { suspended: false, status: 'APPROVED' } }),
    prisma.jobAd.count({
      where: {
        deadline: { gte: new Date() },
        company: { suspended: false, status: 'APPROVED' },
      },
    }),
    hamtaOnskelista(12),
  ]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-sand-200 bg-white">
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

      <section className="bg-gradient-to-b from-white to-sand-50">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-600">
            Gratis för dig som söker jobb
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-sand-900 sm:text-5xl">
            Lägg upp ditt CV en gång – låt företagen hitta dig
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-sand-600">
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
            <ul className="mt-4 space-y-2 text-sm text-sand-600">
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
            <ul className="mt-4 space-y-2 text-sm text-sand-600">
              <li>✓ Kontot är gratis – prenumeration aktiveras i efterhand</li>
              <li>✓ Sök i hela CV-arkivet, filtrera på kommun och kategori</li>
              <li>✓ Hjärta intressanta kandidater och kontakta dem direkt</li>
              <li>✓ Publicera annonser och se vilka som anmält intresse</li>
              <li>✓ Allt ingår – ingen uppdelning i paket</li>
            </ul>
            <div className="mt-5 space-y-3">
              <div className="rounded-lg border-2 border-brand-500 p-4">
                <p className="text-sm font-semibold">Arbetsgivare</p>
                <p className="mt-1 text-2xl font-bold text-brand-600">
                  4 990 kr
                  <span className="text-sm font-normal text-sand-500">/år exkl. moms</span>
                </p>
                <p className="muted mt-1">
                  Eller 799 kr/mån. Full tillgång till CVArkivet och egna annonser.
                </p>
              </div>
              <div className="rounded-lg border border-sand-200 p-4">
                <p className="text-sm font-semibold">Bemanning och rekrytering</p>
                <p className="mt-1 text-2xl font-bold text-brand-600">
                  9 990 kr
                  <span className="text-sm font-normal text-sand-500">/år exkl. moms</span>
                </p>
                <p className="muted mt-1">
                  Eller 1 499 kr/mån. För er som rekryterar åt andra företag.
                </p>
              </div>
            </div>
            <Link href="/registrera/foretag" className="btn-primary mt-6">
              Registrera företag
            </Link>
          </div>
        </div>
      </section>

      {onskade.length > 0 && (
        <section className="border-t border-sand-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">
                Önskelistan
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-sand-900">
                Företagen som kandidaterna väntar på
              </h2>
              <p className="mt-3 text-sand-600">
                Det här är arbetsgivare som våra kandidater vill se här. Står ni med på listan
                finns det redan personer som vill jobba hos er.
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {onskade.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-sand-200 bg-sand-50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-sand-900">{o.namn}</p>
                    {o.website && <p className="truncate text-xs text-sand-500">{o.website}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-bold text-accent-600">{o.roster}</p>
                    <p className="text-[11px] text-sand-500">
                      {o.roster === 1 ? 'väntar' : 'väntar'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/registrera/foretag" className="btn-accent px-6 py-3 text-base">
                Vi finns på listan – registrera oss
              </Link>
              <Link href="/registrera/anvandare" className="btn-secondary px-6 py-3 text-base">
                Önska ett företag
              </Link>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-sand-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-sand-500">
          <p>© {new Date().getFullYear()} CVArkivet.se</p>
          <div className="flex gap-4">
            <Link href="/villkor" className="hover:text-sand-900">
              Användarvillkor
            </Link>
            <Link href="/integritetspolicy" className="hover:text-sand-900">
              Integritetspolicy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
