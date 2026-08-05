import Link from 'next/link';
import { Logo } from '@/components/ui';
import { SUPPORT_EPOST } from '@/lib/data';

export default function Integritetspolicy() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Logo />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="h1 mb-2">Integritetspolicy</h1>
        <p className="muted mb-8">Utkast – ska granskas av jurist före lansering.</p>

        <div className="space-y-6 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="h2 mb-2">Personuppgiftsansvarig</h2>
            <p>CVArkivet.se. Kontakt: {SUPPORT_EPOST}.</p>
          </section>

          <section>
            <h2 className="h2 mb-2">Vilka uppgifter vi behandlar</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Kandidater: namn, födelsedatum, e-post, telefon, CV-innehåll, jobbpreferenser och
                – om du själv väljer att ladda upp en – profilbild.
              </li>
              <li>
                Företag: organisationsnummer, företagsnamn, kontaktperson, e-post, telefon och
                adress.
              </li>
              <li>Loggar: vilka CV ett företag öppnat och vilka företagsprofiler en kandidat besökt.</li>
            </ul>
            <p className="mt-3">
              <b>Vi samlar inte in fullständigt personnummer.</b> Vi lagrar endast födelsedatum, och
              företag ser bara din ålder – aldrig datumet i sig.
            </p>
          </section>

          <section>
            <h2 className="h2 mb-2">Rättslig grund</h2>
            <p>
              Behandlingen sker med stöd av avtal (för att tillhandahålla tjänsten) och samtycke (för
              att publicera ditt CV för arbetsgivare). Samtycket kan när som helst återkallas genom
              att du raderar ditt konto.
            </p>
          </section>

          <section>
            <h2 className="h2 mb-2">Vem ser dina uppgifter</h2>
            <p>
              Ditt CV visas endast för företag som vi har granskat och godkänt, och som har en
              aktiv prenumeration. Du kan när som helst dölja din profil för enskilda företag eller
              för hela e-postdomäner – då blir du helt osynlig för dem.
            </p>
          </section>

          <section>
            <h2 className="h2 mb-2">Lagringstid</h2>
            <p>
              Uppgifterna sparas så länge kontot är aktivt. Raderar du ditt konto tas alla
              uppgifter bort permanent och omedelbart.
            </p>
            <p className="mt-2">
              Konton som inte använts på 24 månader raderas automatiskt. Du får ett mail 30 dagar
              innan det sker, och behåller kontot genom att logga in. Företagskonton utan aktiv
              prenumeration omfattas av samma regel.
            </p>
          </section>

          <section>
            <h2 className="h2 mb-2">Dina rättigheter</h2>
            <p>
              Du har rätt till registerutdrag, rättelse, radering, begränsning och dataportabilitet,
              samt rätt att klaga till Integritetsskyddsmyndigheten (IMY).
            </p>
          </section>

          <section>
            <h2 className="h2 mb-2">Cookies</h2>
            <p>
              Vi använder endast en nödvändig cookie för inloggning. Inga analys- eller
              marknadsföringscookies används.
            </p>
          </section>
        </div>

        <Link href="/" className="btn-secondary mt-10">
          ← Tillbaka
        </Link>
      </main>
    </div>
  );
}
