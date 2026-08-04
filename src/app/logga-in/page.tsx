import Link from 'next/link';
import { Logo } from '@/components/ui';
import LoginForm from './LoginForm';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { fel?: string; aterstallt?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card">
          <h1 className="h1 mb-1">Logga in</h1>
          <p className="muted mb-6">Samma inloggning för kandidat, företag och admin.</p>

          {searchParams.fel === 'avstangd' && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Kontot är avstängt. Kontakta support@cvarkivet.se.
            </div>
          )}

          {searchParams.aterstallt === '1' && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Lösenordet är uppdaterat. Logga in med ditt nya lösenord.
            </div>
          )}

          <LoginForm />

          <p className="mt-4 text-center text-sm">
            <Link href="/glomt-losenord" className="text-brand-600 hover:underline">
              Glömt lösenord?
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Har du inget konto?{' '}
          <Link href="/registrera" className="font-medium text-brand-600 hover:underline">
            Skapa konto
          </Link>
        </p>
      </div>
    </div>
  );
}
