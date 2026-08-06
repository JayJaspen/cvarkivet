import { prisma } from '@/lib/db';
import { Badge, Card } from '@/components/ui';
import { ageFromBirthDate } from '@/lib/utils';
import { FORHANDSVISNING_ANTAL } from '@/lib/data';
import { hiddenUserIdsForCompany } from '@/lib/visibility';
import Paywall from '@/components/Paywall';

/**
 * Smakprov för företag som inte har något abonnemang.
 *
 * Syftet är att visa att arkivet faktiskt innehåller kandidater, utan att ge
 * bort det som abonnemanget kostar pengar för. Därför:
 *
 * - Inga namn, foton, kontaktuppgifter eller löneanspråk.
 * - Ingen länk in i CV:t, och ingen `CvView` loggas – kandidaten ska inte få
 *   ett mail om att någon läst CV:t när ingen faktiskt gjort det.
 * - Kandidater som dolt sig för företaget filtreras bort, precis som i den
 *   riktiga sökningen. Att man är dold ska gälla även i förhandsvisningen.
 */
export default async function Forhandsvisning({
  company,
}: {
  company: { id: string; companyType: string; email: string };
}) {
  const doldaIds = await hiddenUserIdsForCompany(company);

  const [kandidater, totalt] = await Promise.all([
    prisma.user.findMany({
      where: { suspended: false, activelyLooking: true, id: { notIn: doldaIds } },
      // Medvetet inget id: inget som går att koppla till en enskild person
      // ska lämna servern här, inte ens som nyckel i uppmärkningen.
      select: {
        headline: true,
        seeking: true,
        birthDate: true,
        homeMunicipality: true,
        skills: true,
        categories: { select: { category: true } },
      },
      orderBy: [{ cvUpdatedAt: 'desc' }, { createdAt: 'desc' }],
      take: FORHANDSVISNING_ANTAL,
    }),
    prisma.user.count({ where: { suspended: false, id: { notIn: doldaIds } } }),
  ]);

  return (
    <>
      <Card className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="h2">Så här ser CVArkivet ut</h2>
          <p className="muted">
            {totalt === 0
              ? 'Inga kandidater ännu'
              : `Ni ser ${Math.min(FORHANDSVISNING_ANTAL, kandidater.length)} av ${totalt} ${
                  totalt === 1 ? 'kandidat' : 'kandidater'
                }`}
          </p>
        </div>
        <p className="muted mt-1 max-w-2xl">
          Ett smakprov utan namn och kontaktuppgifter. Med abonnemang ser ni hela profilen, kan
          söka och filtrera i hela arkivet, och kontakta kandidaterna direkt.
        </p>

        {kandidater.length === 0 ? (
          <p className="mt-6 rounded-lg border border-sand-200 bg-sand-50 p-4 text-sm text-sand-700">
            Just nu finns inga aktivt jobbsökande kandidater att visa. Nya tillkommer löpande.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {kandidater.map((k, i) => {
              const alder = ageFromBirthDate(k.birthDate);
              return (
                <div
                  key={i}
                  className="flex gap-4 rounded-xl border border-sand-200 bg-sand-50/60 p-4"
                >
                  {/* Medvetet ingen bild och inga initialer – profilen ska inte gå att peka ut. */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sand-200 text-lg text-sand-400">
                    ?
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-sand-900">
                      {k.headline || 'Kandidat utan yrkesrubrik'}
                    </p>
                    <p className="muted">
                      {alder !== null ? `${alder} år` : 'Ålder ej angiven'}
                      {k.homeMunicipality ? ` · ${k.homeMunicipality}` : ''}
                    </p>
                    {k.seeking && (
                      <p className="mt-1 text-sm font-medium text-brand-700">Söker: {k.seeking}</p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="green">Söker aktivt</Badge>
                      {k.categories.slice(0, 3).map((c) => (
                        <Badge key={c.category} tone="blue">
                          {c.category}
                        </Badge>
                      ))}
                    </div>

                    {k.skills && (
                      <p className="mt-2 text-sm text-sand-700">
                        {k.skills.length > 160 ? `${k.skills.slice(0, 160)}…` : k.skills}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            <p className="pt-1 text-xs text-sand-500">
              Namn, kontaktuppgifter, personligt brev, arbetslivserfarenhet och utbildning visas
              först med ett aktivt abonnemang.
            </p>
          </div>
        )}
      </Card>

      <Paywall
        companyType={company.companyType}
        title="Se hela arkivet"
        kompakt
      />
    </>
  );
}
