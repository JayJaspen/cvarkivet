import Link from 'next/link';
import { Logo } from '@/components/ui';

export default function Villkor() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Logo />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="h1 mb-2">Användarvillkor</h1>
        <p className="muted mb-8">Utkast – ska granskas av jurist före lansering.</p>

        <div className="space-y-6 text-sm leading-relaxed text-slate-700">
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
              För att söka bland CV eller publicera annonser krävs en aktiv prenumeration:
              CV-prenumeration 299 kr/mån eller CV + Annonspaket 499 kr/mån (priser exklusive
              moms). Prenumerationen faktureras månadsvis.
            </p>
            <p className="mt-2">
              Prenumerationen kan sägas upp när som helst. Efter uppsägning kan en ny prenumeration
              tecknas tidigast två månader senare.
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
