import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import { aiArPakopplad, kostnadKronor, MODELLPRIS, USD_TILL_SEK } from '@/lib/ai';
import { aiArAvstangt, forbrukning, KVOTER } from '@/lib/ai-kvot';
import { vaxlaAiNodstopp } from '@/app/actions/admin';

export const dynamic = 'force-dynamic';

const kronor = (n: number) =>
  n.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function AiPage() {
  await requireAdmin();

  const nu = new Date();
  const idag = new Date(nu);
  idag.setHours(0, 0, 0, 0);
  const manad = new Date(nu.getFullYear(), nu.getMonth(), 1);
  const allt = new Date(0);

  const [avstangt, dag, man, total, senaste] = await Promise.all([
    aiArAvstangt(),
    forbrukning(idag),
    forbrukning(manad),
    forbrukning(allt),
    prisma.aiAnrop.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        id: true,
        typ: true,
        modell: true,
        inTokens: true,
        utTokens: true,
        lyckades: true,
        createdAt: true,
        userId: true,
        companyId: true,
      },
    }),
  ]);

  const rutor = [
    { namn: 'I dag', data: dag },
    { namn: 'Denna månad', data: man },
    { namn: 'Totalt', data: total },
  ];

  return (
    <>
      <PageHeader
        title="AI-förbrukning"
        description="Varje anrop mot Claude kostar pengar. Här ser du exakt vad som förbrukats och av vem."
      />

      {!aiArPakopplad() && (
        <div className="mb-6 rounded-xl border border-sand-200 bg-sand-50 p-4 text-sm text-sand-700">
          Ingen <code className="rounded bg-white px-1">ANTHROPIC_API_KEY</code> är satt, så
          AI-funktionerna är avstängda och osynliga för användarna. Ingenting kan kosta något.
        </div>
      )}

      {/* Nödstopp */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="h2 mb-1">Nödstopp</h2>
            <p className="muted max-w-2xl">
              Stänger av både matchning och CV-granskning på sekunden, utan att sajten behöver
              läggas upp på nytt. Knapparna försvinner för kandidater och företag, och inga nya
              anrop kan göras. Sparade poäng och granskningar ligger kvar.
            </p>
          </div>

          <form action={vaxlaAiNodstopp} className="shrink-0">
            <input type="hidden" name="pa" value={avstangt ? 'nej' : 'ja'} />
            <button className={avstangt ? 'btn-primary' : 'btn-danger'} type="submit">
              {avstangt ? 'Slå på AI igen' : 'Stäng av AI nu'}
            </button>
          </form>
        </div>

        <p className="mt-4">
          {avstangt ? (
            <Badge tone="red">AI är avstängt</Badge>
          ) : (
            <Badge tone="green">AI är påslaget</Badge>
          )}
        </p>
      </Card>

      {/* Förbrukning */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {rutor.map((r) => (
          <Card key={r.namn}>
            <p className="label">{r.namn}</p>
            <p className="mt-1 text-3xl font-bold text-brand-600">{kronor(r.data.kronor)} kr</p>
            <p className="muted mt-2">
              {r.data.antal} {r.data.antal === 1 ? 'anrop' : 'anrop'} · {r.data.matchningar}{' '}
              matchningar · {r.data.granskningar} granskningar
            </p>
          </Card>
        ))}
      </div>

      {/* Spärrar */}
      <Card className="mb-6">
        <h2 className="h2 mb-3">Så hålls kostnaden nere</h2>
        <ul className="space-y-2 text-sm text-sand-700">
          <li>
            • <b>Inget sker automatiskt.</b> Varje anrop kräver att en kandidat eller ett företag
            trycker på en knapp. Ingenting körs vid inloggning, sidvisning eller på schema.
          </li>
          <li>
            • <b>Svar återanvänds.</b> En uträknad matchning sparas och räknas om först när CV:t
            eller annonsen ändrats. Att öppna samma sida igen kostar ingenting.
          </li>
          <li>
            • <b>Dygnskvot per kandidat:</b> {KVOTER.MATCHNING_PER_KANDIDAT} matchningar och{' '}
            {KVOTER.GRANSKNING_PER_KANDIDAT} CV-granskningar.
          </li>
          <li>
            • <b>Dygnskvot per företag:</b> {KVOTER.MATCHNING_PER_FORETAG} matchningar, och högst
            25 kandidater per klick.
          </li>
          <li>
            • <b>Tak för hela sajten:</b> {KVOTER.ANROP_TOTALT} anrop per dygn. Nås det stängs
            funktionerna av till midnatt.
          </li>
        </ul>

        <p className="mt-4 text-xs text-sand-500">
          Kostnaden räknas på verklig tokenförbrukning från API-svaret, omräknat till kronor med
          kursen {USD_TILL_SEK} kr/dollar. Kursen ändras med miljövariabeln{' '}
          <code className="rounded bg-sand-100 px-1">USD_KURS</code>. Aktuella modellpriser per
          miljon tokens:{' '}
          {Object.entries(MODELLPRIS)
            .map(([m, p]) => `${m} $${p.in}/$${p.ut}`)
            .join(' · ')}
          .
        </p>
      </Card>

      {/* Senaste anropen */}
      <Card>
        <h2 className="h2 mb-4">Senaste anropen</h2>

        {senaste.length === 0 ? (
          <Empty>Inga AI-anrop har gjorts ännu.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-200 text-left text-sand-500">
                  <th className="pb-2 font-medium">Tidpunkt</th>
                  <th className="pb-2 font-medium">Typ</th>
                  <th className="pb-2 font-medium">Beställare</th>
                  <th className="pb-2 font-medium">Modell</th>
                  <th className="pb-2 text-right font-medium">Tokens in/ut</th>
                  <th className="pb-2 text-right font-medium">Kostnad</th>
                </tr>
              </thead>
              <tbody>
                {senaste.map((a) => (
                  <tr key={a.id} className="border-b border-sand-100">
                    <td className="py-2 text-sand-600">{formatDateTime(a.createdAt)}</td>
                    <td className="py-2">
                      {a.typ === 'MATCHNING' ? 'Matchning' : 'CV-granskning'}
                      {!a.lyckades && (
                        <span className="ml-2 text-xs text-accent-700">misslyckades</span>
                      )}
                    </td>
                    <td className="py-2 text-sand-600">
                      {a.companyId ? 'Företag' : a.userId ? 'Kandidat' : 'Raderat konto'}
                    </td>
                    <td className="py-2 text-xs text-sand-500">{a.modell}</td>
                    <td className="py-2 text-right text-sand-600">
                      {a.inTokens} / {a.utTokens}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {kronor(kostnadKronor(a.modell, a.inTokens, a.utTokens, a.createdAt))} kr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
