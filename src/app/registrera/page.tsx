import Link from 'next/link';
import { Logo } from '@/components/ui';

export default function RegisterChoice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <h1 className="mb-8 text-center text-2xl font-semibold">Vad vill du skapa för konto?</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/registrera/anvandare" className="card transition hover:border-brand-400">
            <p className="h2">Jag söker jobb</p>
            <p className="muted mt-2">
              Skapa ditt CV gratis. Kontot är aktivt direkt, ingen verifiering behövs.
            </p>
            <p className="mt-4 text-sm font-medium text-brand-600">Skapa CV →</p>
          </Link>

          <Link href="/registrera/foretag" className="card transition hover:border-brand-400">
            <p className="h2">Vi söker medarbetare</p>
            <p className="muted mt-2">
              Registrera ert företag gratis och aktivera prenumeration när ni vill.
            </p>
            <p className="mt-4 text-sm font-medium text-brand-600">Registrera företag →</p>
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-sand-600">
          Har du redan ett konto?{' '}
          <Link href="/logga-in" className="font-medium text-brand-600 hover:underline">
            Logga in
          </Link>
        </p>
      </div>
    </div>
  );
}
