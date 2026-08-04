import Link from 'next/link';
import { Logo } from '@/components/ui';
import ResetForm from './ResetForm';

export default function AterstallLosenord({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? '';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card">
          <h1 className="h1 mb-1">Välj nytt lösenord</h1>
          <p className="muted mb-6">Minst 8 tecken.</p>

          {token ? (
            <ResetForm token={token} />
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Länken saknar en giltig kod.{' '}
              <Link href="/glomt-losenord" className="font-medium underline">
                Begär en ny återställning
              </Link>
              .
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/logga-in" className="font-medium text-brand-600 hover:underline">
            ← Tillbaka till inloggningen
          </Link>
        </p>
      </div>
    </div>
  );
}
