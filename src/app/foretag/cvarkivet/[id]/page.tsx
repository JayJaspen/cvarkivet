import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireCompany } from '@/lib/session';
import { arGodkant, harCvAtkomst } from '@/lib/data';
import GranskningNotis from '@/components/GranskningNotis';
import { Badge, Card, PageHeader } from '@/components/ui';
import { ageFromBirthDate, formatDateTime, kr } from '@/lib/utils';
import { isUserHiddenFrom } from '@/lib/visibility';
import { logCvView } from '@/lib/notifications';
import Paywall from '@/components/Paywall';
import { messageCandidate, toggleHeart } from '@/app/actions/company';

export const dynamic = 'force-dynamic';

export default async function CvDetail({ params }: { params: { id: string } }) {
  const company = await requireCompany();

  if (!arGodkant(company)) {
    return (
      <>
        <PageHeader title="CVArkivet" />
        <GranskningNotis status={company.status} reviewNote={company.reviewNote} />
      </>
    );
  }

  if (!harCvAtkomst(company)) {
    return (
      <>
        <PageHeader title="CVArkivet" />
        <Paywall need="CV" />
      </>
    );
  }

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

  // Logga visningen och notifiera kandidaten (max en gång per dygn och företag)
  await logCvView(company, user);

  const [heart, fav, messages] = await Promise.all([
    prisma.heart.findUnique({
      where: { companyId_userId: { companyId: company.id, userId: user.id } },
    }),
    prisma.favorite.findUnique({
      where: { userId_companyId: { userId: user.id, companyId: company.id } },
    }),
    prisma.message.findMany({
      where: { companyId: company.id, userId: user.id },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const age = ageFromBirthDate(user.birthDate);

  return (
    <>
      <Link href="/foretag/cvarkivet" className="muted mb-4 inline-block hover:text-slate-900">
        ← Tillbaka till CVArkivet
      </Link>

      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description={user.headline ?? undefined}
        action={
          <form action={toggleHeart}>
            <input type="hidden" name="userId" value={user.id} />
            <button className={heart ? 'btn-primary' : 'btn-secondary'} type="submit">
              {heart ? '♥ Hjärtad' : '♡ Hjärta kandidaten'}
            </button>
          </form>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="h2 mb-3">Presentation</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {user.summary || 'Ingen presentation angiven.'}
            </p>
          </Card>

          <Card>
            <h2 className="h2 mb-3">Personligt brev</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {user.coverLetter || 'Inget personligt brev angivet.'}
            </p>
          </Card>

          <Card>
            <h2 className="h2 mb-4">Arbetslivserfarenhet</h2>
            {user.experiences.length === 0 ? (
              <p className="muted">Ingen erfarenhet angiven.</p>
            ) : (
              <div className="space-y-4">
                {user.experiences.map((e) => (
                  <div key={e.id} className="border-l-2 border-brand-200 pl-4">
                    <p className="font-medium">{e.title}</p>
                    <p className="text-sm text-slate-600">
                      {e.employer}
                      {e.location ? ` · ${e.location}` : ''}
                    </p>
                    <p className="muted">
                      {e.fromDate} – {e.toDate || 'pågående'}
                    </p>
                    {e.description && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                        {e.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="h2 mb-4">Utbildning</h2>
            {user.educations.length === 0 ? (
              <p className="muted">Ingen utbildning angiven.</p>
            ) : (
              <div className="space-y-4">
                {user.educations.map((e) => (
                  <div key={e.id} className="border-l-2 border-brand-200 pl-4">
                    <p className="font-medium">{e.program}</p>
                    <p className="text-sm text-slate-600">{e.school}</p>
                    <p className="muted">
                      {e.fromDate} – {e.toDate || 'pågående'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="h2 mb-3">Fakta</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-0.5 flex flex-wrap gap-1">
                  {user.activelyLooking ? (
                    <Badge tone="green">Söker aktivt jobb</Badge>
                  ) : (
                    <Badge>Söker inte aktivt</Badge>
                  )}
                  {fav && <Badge tone="pink">★ Har er som favoritföretag</Badge>}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Ålder</dt>
                <dd>{age !== null ? `${age} år` : '–'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Hemmahörande kommun</dt>
                <dd>{user.homeMunicipality || '–'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Aktuella kommuner</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {user.municipalities.length === 0 && '–'}
                  {user.municipalities.map((m) => (
                    <Badge key={m.id}>{m.municipality}</Badge>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Jobbkategorier</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {user.categories.length === 0 && '–'}
                  {user.categories.map((k) => (
                    <Badge key={k.id} tone="blue">
                      {k.category}
                    </Badge>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Löneanspråk</dt>
                <dd>{user.salaryExpectation ? `${kr(user.salaryExpectation)}/mån` : 'Ej angivet'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Kompetenser</dt>
                <dd>{user.skills || '–'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Språk</dt>
                <dd>{user.languages || '–'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Körkort</dt>
                <dd>{user.drivingLicense || '–'}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="h2 mb-1">Kontakta kandidaten</h2>
            <p className="muted mb-3">
              Meddelandet hamnar i kandidatens inkorg på CVArkivet.
            </p>

            {messages.length > 0 && (
              <div className="mb-3 max-h-56 space-y-2 overflow-y-auto">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      m.senderType === 'COMPANY'
                        ? 'bg-brand-50 text-brand-900'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {m.senderType === 'COMPANY' ? 'Vi' : user.firstName} ·{' '}
                      {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <form action={messageCandidate} className="space-y-2">
              <input type="hidden" name="userId" value={user.id} />
              <textarea
                name="body"
                rows={3}
                placeholder="Hej! Vi har en tjänst som kan passa dig…"
                className="input"
              />
              <button className="btn-primary w-full" type="submit">
                Skicka meddelande
              </button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
