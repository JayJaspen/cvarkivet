import Link from 'next/link';
import { Card } from './ui';
import { SUPPORT_EPOST } from '@/lib/data';

/**
 * Visas för företag vars konto ännu inte granskats, eller som fått avslag.
 * Ersätter paywallen – det är ingen idé att sälja in en prenumeration till
 * någon som inte får använda tjänsten.
 */
export default function GranskningNotis({
  status,
  reviewNote,
}: {
  status: string;
  reviewNote?: string | null;
}) {
  if (status === 'REJECTED') {
    return (
      <Card className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
          ✕
        </div>
        <h2 className="h2">Ansökan har fått avslag</h2>
        <p className="muted mx-auto mt-2 max-w-md">
          Vi har granskat er registrering och kan inte godkänna kontot.
        </p>
        {reviewNote && (
          <div className="mx-auto mt-4 max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-left text-sm text-red-900">
            <p className="font-semibold">Motivering</p>
            <p className="mt-1 whitespace-pre-wrap">{reviewNote}</p>
          </div>
        )}
        <p className="muted mt-4">
          Tror ni att det blivit fel? Hör av er till{' '}
          <a href={`mailto:${SUPPORT_EPOST}`} className="text-brand-600 hover:underline">
            {SUPPORT_EPOST}
          </a>
          .
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
        ⏳
      </div>
      <h2 className="h2">Ert konto granskas</h2>
      <p className="muted mx-auto mt-2 max-w-md">
        Alla företag granskas manuellt innan de får tillgång till CVArkivet. Det skyddar
        kandidaterna från att deras uppgifter hamnar hos oseriösa aktörer.
      </p>

      <div className="mx-auto mt-6 max-w-md rounded-xl border border-sand-200 p-5 text-left text-sm">
        <p className="font-semibold text-sand-900">Under tiden kan ni:</p>
        <ul className="mt-2 space-y-1.5 text-sand-600">
          <li>• Fylla i er företagspresentation</li>
          <li>• Ladda upp er logotyp</li>
          <li>• Kontrollera att kontaktuppgifterna stämmer</li>
        </ul>
        <p className="mt-4 text-sand-600">
          Ju mer ni fyller i, desto snabbare går granskningen. Ni får ett mail så snart
          kontot är godkänt.
        </p>
      </div>

      <Link href="/foretag/var-sida" className="btn-primary mt-6">
        Komplettera våra uppgifter
      </Link>
    </Card>
  );
}
