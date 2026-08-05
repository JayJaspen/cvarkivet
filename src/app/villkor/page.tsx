import Link from 'next/link';
import { Logo } from '@/components/ui';

export default function Villkor() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-sand-200">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Logo />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="h1 mb-2">Användarvillkor</h1>
        <p className="muted mb-8">Utkast – ska granskas av jurist före lansering.</p>

        <div className="space-y-6 text-sm leading-relaxed text-sand-800">
          <section>
            <h2 className="h2 mb-2">1. Tjänsten</h2>
            <p>
              CVArkivet.se förmedlar kontakt mellan kandidater och arbetsgivare. Vi är inte part i
              anställningsavtal och ansvarar inte för innehållet i annonser eller CV.
            </p>
          </section>

          <section>
            <h2 className="h2 mb-2">2. Konto för kandidater</h2>
            <p>
              Kontot är kostnadsfritt och aktiveras direkt vid registrering. Du ansvarar för att
              uppgifterna du lämnar är korrekta och att du har rätt att publicera dem. Du kan när som
              helst radera ditt konto.
            </p>
          </section>

          <section>
            <h2 className="h2 mb-2">3. Konto för företag</h2>
            <p>
              Registrering är kostnadsfri. Alla företagskonton granskas manuellt innan de får
              tillgång till kandidaternas CV. CVArkivet förbehåller sig rätten att neka ett
              företag utan att ange skäl, exempelvis om uppgifterna inte går att verifiera.
            </p>
            <p className="mt-2">
              Företag ska registrera sig med en e-postadress på företagets egen domän. Privata
              adresser hos gratistjänster godkänns inte.
            </p>
            <p className="mt-2">
              För att söka bland CV eller publicera annonser krävs en aktiv prenumeration. Priset
              beror på verksamhetens art. Alla prenumerationer ger full tillgång till både
              CV-databasen och annonsering. Priser exklusive moms:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Arbetsgivare: 4 990 kr per år eller 799 kr per månad.</li>
              <li>
                Bemannings- och rekryteringsföretag: 9 990 kr per år eller 1 499 kr per månad.
                Hit räknas verksamheter som rekryterar eller hyr ut personal åt andra företag.
              </li>
            </ul>
            <p className="mt-2">
              CVArkivet avgör vilken kategori ett företag tillhör och kan korrigera en felaktig
              uppgift. Visar det sig att ett företag angett fel kategori kan CVArkivet
              efterfakturera mellanskillnaden eller avsluta kontot.
            </p>
            <p className="mt-2">
              <b>Månadsabonnemang</b> faktureras månadsvis och kan sägas upp när som helst.
              Åtkomsten upphör vid uppsägningen, och en ny prenumeration kan tecknas tidigast två
              månader senare.
            </p>
            <p className="mt-2">
              <b>Årsabonnemang</b> faktureras i förskott och gäller tolv månader. Vid uppsägning i
              förtid behåller företaget åtkomsten till periodens slut. Ingen återbetalning sker för
              outnyttjad tid.
            </p>
            <p className="mt-2">
              Uppgifter från CVArkivet får endast användas för rekryteringsändamål. Det är inte
              tillåtet att exportera, sälja vidare eller använda kandidatuppgifter för
              marknadsföring.
            </p>
          </section>

          <section>
            <h2 className="h2 mb-2">4. Otillåtet innehåll</h2>
            <p>
              Det är inte tillåtet att publicera diskriminerande, olagligt eller vilseledande
              innehåll. CVArkivet får stänga av konton som bryter mot villkoren.
            </p>
          </section>

          <section>
            <h2 className="h2 mb-2">5. Ansvarsbegränsning</h2>
            <p>
              Tjänsten tillhandahålls i befintligt skick. CVArkivet ansvarar inte för indirekt skada
              eller utebliven vinst.
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
