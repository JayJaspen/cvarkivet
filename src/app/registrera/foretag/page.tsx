import Link from 'next/link';
import { Logo, Notice } from '@/components/ui';
import CompanyForm from './CompanyForm';

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <Notice tone="amber" title="Alla företag granskas innan de får tillgång">
          <p>
            För att skydda kandidaternas uppgifter godkänner vi varje företag manuellt. Ni kan
            logga in och fylla i era uppgifter direkt, men får tillgång till CVArkivet först när
            granskningen är klar. Ni får ett mail när det är gjort.
          </p>
          <p className="mt-2">
            Registrera er med företagets egen e-postadress – privata adresser som Gmail eller
            Hotmail godkänns inte.
          </p>
        </Notice>

        <Notice tone="blue" title="Det är gratis att skapa konto">
          <p>
            Registreringen kostar ingenting. För att kunna använda tjänsten – söka bland CV och
            publicera annonser – aktiverar ni en prenumeration under fliken <b>Vår sida</b> när
            kontot är godkänt.
          </p>
          <ul className="mt-2 space-y-1">
            <li>
              • <b>CV-prenumeration</b> – 299 kr/mån exkl. moms
            </li>
            <li>
              • <b>CV + Annonspaket</b> – 499 kr/mån exkl. moms
            </li>
          </ul>
        </Notice>

        <div className="card">
          <h1 className="h1">Registrera företag</h1>
          <p className="muted mt-1 mb-6">
            Ni loggar in direkt efter registrering, men får tillgång till CVArkivet när vi
            har granskat uppgifterna. Det går oftast på en arbetsdag.
          </p>
          <CompanyForm />
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Redan registrerade?{' '}
          <Link href="/logga-in" className="font-medium text-brand-600 hover:underline">
            Logga in
          </Link>
        </p>
      </div>
    </div>
  );
}
