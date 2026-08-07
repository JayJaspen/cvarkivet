import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Logo } from '@/components/ui';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hamtaOnskelista } from '@/lib/onskelista';
import { visaPublikStatistik } from '@/lib/installningar';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();
  if (session?.role === 'USER') redirect('/kandidat/jobb');
  if (session?.role === 'COMPANY') redirect('/foretag/cvarkivet');
  if (session?.role === 'ADMIN') redirect('/admin/anvandare');

  // Siffrorna hämtas bara när de ska visas. Är statistiken avstängd finns
  // ingenting att läcka, inte ens i sidans data.
  const visaStatistik = await visaPublikStatistik();

  const [statistik, onskade] = await Promise.all([
    visaStatistik
      ? Promise.all([
          prisma.user.count({ where: { suspended: false } }),
          prisma.company.count({ where: { suspended: false, status: 'APPROVED' } }),
          prisma.jobAd.count({
            where: {
              deadline: { gte: new Date() },
              company: { suspended: false, status: 'APPROVED' },
            },
          }),
        ])
      : Promise.resolve(null),
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
            Lägg upp ditt CV &amp; låt företag hitta dig
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

          {/* Tre steg i stället för antalsrutor. Fungerar från dag ett och blir
              inte pinsamt för att vi är få. */}
          <ol className="mx-auto mt-16 grid max-w-3xl gap-8 text-left sm:grid-cols-3">
            {[
              {
                n: '1',
                r: 'Fyll i ditt CV',
                t: 'Tar några minuter. Helt gratis, och kontot är aktivt direkt.',
              },
              {
                n: '2',
                r: 'Företagen söker',
                t: 'Du ser exakt vilka som öppnat ditt CV – och kan dölja dig för vem du vill.',
              },
              {
                n: '3',
                r: 'De hör av sig',
                t: 'Kontakten sker här i tjänsten. Du behöver aldrig lämna ut din adress.',
              },
            ].map((s) => (
              <li key={s.n}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                  {s.n}
                </span>
                <p className="mt-3 font-semibold text-sand-900">{s.r}</p>
                <p className="muted mt-1">{s.t}</p>
              </li>
            ))}
          </ol>

          {statistik && (
            <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4">
              {[
                { n: statistik[0], l: 'Registrerade kandidater' },
                { n: statistik[1], l: 'Anslutna företag' },
                { n: statistik[2], l: 'Aktiva annonser' },
              ].map((s) => (
                <div key={s.l} className="card">
                  <dt className="text-3xl font-bold text-brand-600">{s.n}</dt>
                  <dd className="muted mt-1">{s.l}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-sand-900">
              Du bestämmer vem som ser dig
            </h2>
            <ul className="mt-6 space-y-3 text-sand-700">
              {[
                'Helt gratis, och kontot är aktivt direkt',
                'Dölj din profil för din nuvarande arbetsgivare',
                'Se exakt vilka företag som läst ditt CV',
                'Blockera hela e-postdomäner du inte vill nås av',
                'Välj distans och flera kommuner samtidigt',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="mt-0.5 h-5 w-5 shrink-0 text-brand-600"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Link href="/registrera/anvandare" className="btn-primary mt-8 px-6 py-3 text-base">
              Skapa mitt CV
            </Link>
          </div>

          {/* Exempelprofil. Tidigare grå platshållarstreck, som såg ut som en
              sida som inte laddat klart. Innehållet är påhittat och märkt som
              exempel – ingen riktig kandidat visas här. */}
          <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-sand-400">
              Exempel
            </p>

            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
                MA
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sand-900">Innesäljare med telefonvana</p>
                <p className="muted">34 år · Växjö</p>
                <p className="mt-1 text-sm font-medium text-brand-700">Söker: Innesäljare</p>
              </div>
              <span className="badge shrink-0 bg-brand-100 text-brand-800">Söker aktivt</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="badge bg-sand-100 text-sand-700">Försäljning &amp; detaljhandel</span>
              <span className="badge bg-sand-100 text-sand-700">Växjö</span>
              <span className="badge bg-sand-100 text-sand-700">Distans</span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-sand-700">
              Fem år av B2B-försäljning mot bygghandeln. Van vid hela kedjan från kall kontakt
              till avslut, och trivs bäst när jag får äga mina egna kunder.
            </p>

            <p className="mt-3 text-sm text-sand-600">
              <span className="font-medium text-sand-800">Kompetenser:</span> Salesforce,
              offerthantering, B-körkort
            </p>

            <p className="mt-5 border-t border-sand-200 pt-4 text-xs text-sand-500">
              Så här ser en profil ut när ett företag söker i CVArkivet.
            </p>
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
                      {o.roster === 1 ? 'person väntar' : 'personer väntar'}
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

      <section className="border-t border-sand-200 bg-brand-50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">
            För arbetsgivare
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-900">
            Söker ni personal?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-800">
            Skapa konto gratis och se ett smakprov ur arkivet innan ni bestämmer er. Sök bland
            kandidater, publicera annonser och kontakta folk direkt – allt ingår, ingen
            uppdelning i paket.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/registrera/foretag" className="btn-primary px-6 py-3 text-base">
              Registrera företag – gratis
            </Link>
            <p className="text-sm text-brand-800">
              Abonnemang från <b>4 990 kr/år</b> exkl. moms.{' '}
              <Link href="/villkor" className="underline hover:no-underline">
                Se priser
              </Link>
            </p>
          </div>
        </div>
      </section>

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
