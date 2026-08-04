import Link from 'next/link';
import { Logo } from '@/components/ui';
import UserForm from './UserForm';

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="card">
          <h1 className="h1">Skapa ditt konto</h1>
          <p className="muted mt-1 mb-6">
            Gratis, alltid. Kontot blir aktivt direkt – du behöver inte verifiera något.
          </p>
          <UserForm />
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Redan registrerad?{' '}
          <Link href="/logga-in" className="font-medium text-brand-600 hover:underline">
            Logga in
          </Link>
        </p>
      </div>
    </div>
  );
}
