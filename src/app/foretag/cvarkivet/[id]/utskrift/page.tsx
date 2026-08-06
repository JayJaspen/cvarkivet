import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireCompany } from '@/lib/session';
import { arGodkant, harCvAtkomst } from '@/lib/data';
import { isUserHiddenFrom } from '@/lib/visibility';
import { ageFromBirthDate, formatDate, kr } from '@/lib/utils';
import Utskriftsknappar from './Utskriftsknappar';

export const dynamic = 'force-dynamic';

/**
 * Utskriftsvänlig version av ett CV.
 *
 * Företaget kan skriva ut den eller spara som PDF via webbläsarens
 * utskriftsdialog. Nedladdningen loggas – kandidaten ska kunna se att
 * uppgifterna lämnat plattformen.
 */
export default async function CvUtskrift({ params }: { params: { id: string } }) {
  const company = await requireCompany();
  if (!arGodkant(company) || !harCvAtkomst(company)) notFound();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      categories: true,
      municipalities: true,
      experiences: { orderBy: { fromDate: 'desc' } },
      educations: { orderBy: { fromDate: 'desc' } },
    },
  });
  if (!user || user.suspended) notFound();
  if (await isUserHiddenFrom(user.id, company)) notFound();

  await prisma.cvDownload.create({ data: { companyId: company.id, userId: user.id } });

  const alder = ageFromBirthDate(user.birthDate);

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 print:max-w-none print:p-0">
      <Utskriftsknappar tillbakaHref={`/foretag/cvarkivet/${user.id}`} />

      <header className="mb-6 flex items-start justify-between gap-6 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-sand-900">
            {user.firstName} {user.lastName}
          </h1>
          {user.headline && <p className="mt-1 text-lg text-sand-700">{user.headline}</p>}
          {user.seeking && (
            <p className="mt-1 font-medium text-brand-700">Söker: {user.seeking}</p>
          )}
          <p className="mt-3 text-sm text-sand-600">
            {alder !== null && `${alder} år · `}
            {user.homeMunicipality ?? 'Ort ej angiven'}
            {' · '}
            {user.email} · {user.phone}
          </p>
        </div>

        {user.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoUrl}
            alt=""
            className="h-24 w-24 shrink-0 rounded-full border border-sand-200 object-cover"
          />
        )}
      </header>

      <section className="mb-6">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-sand-500">
          Presentation
        </h2>
        <p className="whitespace-pre-wrap text-sm text-sand-800">
          {user.summary || 'Ingen presentation angiven.'}
        </p>
      </section>

      {user.coverLetter && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-sand-500">
            Personligt brev
          </h2>
          <p className="whitespace-pre-wrap text-sm text-sand-800">{user.coverLetter}</p>
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-sand-500">
          Arbetslivserfarenhet
        </h2>
        {user.experiences.length === 0 ? (
          <p className="text-sm text-sand-500">Ingen angiven.</p>
        ) : (
          <div className="space-y-3">
            {user.experiences.map((e) => (
              <div key={e.id} className="break-inside-avoid">
                <p className="font-semibold text-sand-900">{e.title}</p>
                <p className="text-sm text-sand-700">
                  {e.employer}
                  {e.location ? ` · ${e.location}` : ''} · {e.fromDate}–{e.toDate || 'pågående'}
                </p>
                {e.description && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-sand-800">{e.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-sand-500">
          Utbildning
        </h2>
        {user.educations.length === 0 ? (
          <p className="text-sm text-sand-500">Ingen angiven.</p>
        ) : (
          <div className="space-y-2">
            {user.educations.map((e) => (
              <div key={e.id} className="break-inside-avoid">
                <p className="font-semibold text-sand-900">{e.program}</p>
                <p className="text-sm text-sand-700">
                  {e.school} · {e.fromDate}–{e.toDate || 'pågående'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-sand-500">
            Kompetenser
          </h2>
          <p className="text-sm text-sand-800">{user.skills || '–'}</p>
        </div>
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-sand-500">Språk</h2>
          <p className="text-sm text-sand-800">{user.languages || '–'}</p>
        </div>
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-sand-500">
            Körkort
          </h2>
          <p className="text-sm text-sand-800">{user.drivingLicense || '–'}</p>
        </div>
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-sand-500">
            Löneanspråk
          </h2>
          <p className="text-sm text-sand-800">
            {user.salaryExpectation ? `${kr(user.salaryExpectation)}/mån` : 'Ej angivet'}
          </p>
        </div>
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-sand-500">
            Sökta yrkeskategorier
          </h2>
          <p className="text-sm text-sand-800">
            {user.categories.map((c) => c.category).join(', ') || '–'}
          </p>
        </div>
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-sand-500">
            Aktuella kommuner
          </h2>
          <p className="text-sm text-sand-800">
            {user.municipalities.map((m) => m.municipality).join(', ') || '–'}
          </p>
        </div>
      </section>

      <footer className="border-t border-sand-300 pt-4 text-xs text-sand-500">
        <p>
          Hämtat från CVArkivet.se {formatDate(new Date())} av {company.name}. Uppgifterna
          tillhör kandidaten och får bara användas för rekryteringsändamål.
        </p>
      </footer>
    </div>
  );
}
