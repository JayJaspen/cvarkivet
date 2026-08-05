import Link from 'next/link';
import { Logo } from '@/components/ui';
import ForgotForm from './ForgotForm';

export default function GlomtLosenord() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card">
          <h1 className="h1 mb-1">Glömt lösenord</h1>
          <p className="muted mb-6">
            Skriv in din e-postadress så skickar vi en länk för att välja ett nytt lösenord. Fungerar
            för både kandidat- och företagskonton.
          </p>
          <ForgotForm />
        </div>

        <p className="mt-6 text-center text-sm text-sand-600">
          <Link href="/logga-in" className="font-medium text-brand-600 hover:underline">
            ← Tillbaka till inloggningen
          </Link>
        </p>
      </div>
    </div>
  );
}
