import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { Card, Notice, PageHeader } from '@/components/ui';
import { addEducation, addExperience, deleteEducation, deleteExperience } from '@/app/actions/user';
import CvForm from './CvForm';
import Granskning, { type Forslag } from './Granskning';
import { aiArPakopplad } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export default async function CvPage({
  searchParams,
}: {
  searchParams: { valkommen?: string };
}) {
  const user = await requireUser();

  const [categories, municipalities, experiences, educations, granskning] = await Promise.all([
    prisma.userCategory.findMany({ where: { userId: user.id } }),
    prisma.userMunicipality.findMany({ where: { userId: user.id } }),
    prisma.experience.findMany({ where: { userId: user.id }, orderBy: { fromDate: 'desc' } }),
    prisma.education.findMany({ where: { userId: user.id }, orderBy: { fromDate: 'desc' } }),
    prisma.cvReview.findUnique({ where: { userId: user.id } }),
  ]);

  const granskningsdata = granskning
    ? {
        summary: granskning.summary,
        completeness: granskning.completeness,
        suggestions: JSON.parse(granskning.suggestions) as Forslag[],
        createdAt: granskning.createdAt,
      }
    : null;

  const granskningInaktuell =
    Boolean(granskning) &&
    (granskning!.cvVersion?.getTime() ?? 0) !== (user.cvUpdatedAt?.getTime() ?? 0);

  return (
    <>
      <PageHeader
        title="Mitt CV"
        description="Det här ser företagen när de öppnar din profil i CVArkivet."
      />

      {searchParams.valkommen && (
        <Notice tone="green" title="Välkommen till CVArkivet!">
          Ditt konto är aktivt. Fyll i ditt CV nedan så blir du synlig för företagen.
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CvForm
            user={user}
            categories={categories.map((c) => c.category)}
            municipalities={municipalities.map((m) => m.municipality)}
          />

          {aiArPakopplad() && (
            <Granskning granskning={granskningsdata} inaktuell={granskningInaktuell} />
          )}

          {/* Arbetslivserfarenhet */}
          <Card>
            <h2 className="h2 mb-4">Arbetslivserfarenhet</h2>

            {experiences.length === 0 && (
              <p className="muted mb-4">Inga poster tillagda ännu.</p>
            )}

            <div className="mb-5 space-y-3">
              {experiences.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-sand-200 p-4"
                >
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-sm text-sand-600">
                      {e.employer}
                      {e.location ? ` · ${e.location}` : ''}
                    </p>
                    <p className="muted">
                      {e.fromDate} – {e.toDate || 'pågående'}
                    </p>
                    {e.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-sand-800">
                        {e.description}
                      </p>
                    )}
                  </div>
                  <form action={deleteExperience}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="btn-danger" type="submit">
                      Ta bort
                    </button>
                  </form>
                </div>
              ))}
            </div>

            <form action={addExperience} className="grid gap-3 rounded-lg bg-sand-50 p-4">
              <p className="text-sm font-medium text-sand-800">Lägg till erfarenhet</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="title" placeholder="Titel *" className="input" required />
                <input name="employer" placeholder="Arbetsgivare *" className="input" required />
                <input name="location" placeholder="Ort" className="input" />
                <div className="grid grid-cols-2 gap-2">
                  <input name="fromDate" placeholder="Från (ÅÅÅÅ-MM)" className="input" />
                  <input name="toDate" placeholder="Till (tomt = pågår)" className="input" />
                </div>
              </div>
              <textarea
                name="description"
                rows={2}
                placeholder="Kort beskrivning av arbetsuppgifter"
                className="input"
              />
              <div>
                <button className="btn-secondary" type="submit">
                  Lägg till
                </button>
              </div>
            </form>
          </Card>

          {/* Utbildning */}
          <Card>
            <h2 className="h2 mb-4">Utbildning</h2>

            {educations.length === 0 && <p className="muted mb-4">Inga poster tillagda ännu.</p>}

            <div className="mb-5 space-y-3">
              {educations.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-sand-200 p-4"
                >
                  <div>
                    <p className="font-medium">{e.program}</p>
                    <p className="text-sm text-sand-600">{e.school}</p>
                    <p className="muted">
                      {e.fromDate} – {e.toDate || 'pågående'}
                    </p>
                  </div>
                  <form action={deleteEducation}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="btn-danger" type="submit">
                      Ta bort
                    </button>
                  </form>
                </div>
              ))}
            </div>

            <form action={addEducation} className="grid gap-3 rounded-lg bg-sand-50 p-4">
              <p className="text-sm font-medium text-sand-800">Lägg till utbildning</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="program" placeholder="Utbildning/program *" className="input" required />
                <input name="school" placeholder="Skola *" className="input" required />
                <input name="fromDate" placeholder="Från (ÅÅÅÅ-MM)" className="input" />
                <input name="toDate" placeholder="Till (tomt = pågår)" className="input" />
              </div>
              <div>
                <button className="btn-secondary" type="submit">
                  Lägg till
                </button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="h2 mb-3">Så syns du</h2>
            <ul className="space-y-2 text-sm text-sand-600">
              <li>
                • Företag med aktiv prenumeration ser namn, ålder, kommun, kategorier, löneanspråk
                och hela ditt CV.
              </li>
              <li>• Du kan dölja dig för enskilda företag under fliken Registrerade företag.</li>
              <li>• Du kan blockera hela e-postdomäner under Min sida.</li>
              <li>
                • Sätter du <b>Söker aktivt jobb</b> till nej ligger CV:t kvar men markeras som
                passivt.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
