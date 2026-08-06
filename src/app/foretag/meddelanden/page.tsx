import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireCompany } from '@/lib/session';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import { harCvAtkomst } from '@/lib/data';
import { hiddenUserIdsForCompany } from '@/lib/visibility';
import { markCompanyMessagesRead, messageCandidate } from '@/app/actions/company';
import UppdateraMeny from '@/components/UppdateraMeny';

export const dynamic = 'force-dynamic';

export default async function ForetagMeddelanden({
  searchParams,
}: {
  searchParams: { kandidat?: string };
}) {
  const company = await requireCompany();

  const all = await prisma.message.findMany({
    where: { companyId: company.id },
    include: { user: { select: { id: true, firstName: true, lastName: true, headline: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const threads = new Map<
    string,
    { name: string; headline: string | null; msgs: typeof all; unread: number }
  >();
  for (const m of all) {
    const t =
      threads.get(m.userId) ?? {
        name: `${m.user.firstName} ${m.user.lastName}`,
        headline: m.user.headline,
        msgs: [],
        unread: 0,
      };
    t.msgs.push(m);
    if (m.senderType === 'USER' && !m.readAt) t.unread++;
    threads.set(m.userId, t);
  }

  const list = Array.from(threads.entries());
  const onskad = searchParams.kandidat;

  /**
   * Företaget kommer ofta hit från en intresseanmälan eller ett CV, till en
   * kandidat de aldrig skrivit till. Då finns ingen tråd att visa, och tidigare
   * hamnade man bara i sina gamla meddelanden utan möjlighet att skriva.
   * Vi hämtar kandidaten och visar en tom tråd i stället.
   */
  let nyKandidat: { id: string; name: string; headline: string | null } | null = null;
  if (onskad && !threads.has(onskad)) {
    const dolda = await hiddenUserIdsForCompany(company);
    // En kandidat som dolt sig för företaget ska inte gå att nå ens med
    // direktlänk – annars kringgår man dölj-funktionen genom att gissa id.
    if (!dolda.includes(onskad)) {
      const k = await prisma.user.findFirst({
        where: { id: onskad, suspended: false },
        select: { id: true, firstName: true, lastName: true, headline: true },
      });
      if (k) nyKandidat = { id: k.id, name: `${k.firstName} ${k.lastName}`, headline: k.headline };
    }
  }

  const activeId = onskad ?? list[0]?.[0];
  const active = activeId ? threads.get(activeId) : undefined;
  const nyAktiv = nyKandidat && activeId === nyKandidat.id ? nyKandidat : null;

  const namn = active?.name ?? nyAktiv?.name;
  const meddelanden = active?.msgs ?? [];
  const kanSkriva = harCvAtkomst(company);

  const attMarkera = activeId && active?.unread ? active.unread : 0;
  if (activeId && attMarkera) await markCompanyMessagesRead(activeId);

  if (list.length === 0 && !nyAktiv) {
    return (
      <>
        <PageHeader title="Meddelanden" description="Er dialog med kandidaterna." />
        <Empty>
          Inga meddelanden ännu. Öppna ett CV i CVArkivet, eller en intresseanmälan på en av era
          annonser, och skicka det första meddelandet.
        </Empty>
      </>
    );
  }

  return (
    <>
      {/* Räknaren i sidomenyn beräknas när layouten monteras och blir annars
          kvar tills sidan laddas om helt. */}
      {attMarkera > 0 && <UppdateraMeny />}

      <PageHeader title="Meddelanden" description="Er dialog med kandidaterna." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="h2 mb-3">Kandidater</h2>
          <ul className="space-y-1">
            {nyAktiv && (
              <li>
                <span className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                  <span>
                    <span className="font-medium">{nyAktiv.name}</span>
                    {nyAktiv.headline && (
                      <span className="block text-xs text-sand-500">{nyAktiv.headline}</span>
                    )}
                  </span>
                  <Badge tone="green">Ny</Badge>
                </span>
              </li>
            )}

            {list.map(([id, t]) => (
              <li key={id}>
                <Link
                  href={`/foretag/meddelanden?kandidat=${id}`}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    id === activeId ? 'bg-brand-50 text-brand-700' : 'hover:bg-sand-50'
                  }`}
                >
                  <span>
                    <span className="font-medium">{t.name}</span>
                    {t.headline && <span className="block text-xs text-sand-500">{t.headline}</span>}
                  </span>
                  {t.unread > 0 && <Badge tone="blue">{t.unread} ny</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          {namn && activeId ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="h2">{namn}</h2>
                <Link
                  href={`/foretag/cvarkivet/${activeId}`}
                  className="text-sm text-brand-600 hover:underline"
                >
                  Öppna CV →
                </Link>
              </div>

              {meddelanden.length === 0 ? (
                <p className="mb-4 rounded-lg border border-sand-200 bg-sand-50 p-4 text-sm text-sand-700">
                  Ni har inte skrivit till {namn} tidigare. Skriv ett första meddelande nedan –
                  kandidaten ser det under sin flik Meddelanden.
                </p>
              ) : (
                <div className="mb-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                  {meddelanden.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                        m.senderType === 'COMPANY'
                          ? 'ml-auto bg-brand-600 text-white'
                          : 'bg-sand-100 text-sand-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p
                        className={`mt-1 text-[11px] ${
                          m.senderType === 'COMPANY' ? 'text-brand-100' : 'text-sand-500'
                        }`}
                      >
                        {formatDateTime(m.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {kanSkriva ? (
                <form action={messageCandidate} className="flex gap-2">
                  <input type="hidden" name="userId" value={activeId} />
                  <input name="body" placeholder="Skriv ett meddelande…" className="input" />
                  <button className="btn-primary shrink-0" type="submit">
                    Skicka
                  </button>
                </form>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Att skicka meddelanden kräver ett aktivt abonnemang. Ni kan läsa tidigare
                  konversationer som vanligt.
                </p>
              )}
            </>
          ) : (
            <Empty>Välj en kandidat.</Empty>
          )}
        </Card>
      </div>
    </>
  );
}
