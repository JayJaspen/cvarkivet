import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireCompany } from '@/lib/session';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import { markCompanyMessagesRead, messageCandidate } from '@/app/actions/company';

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
  const activeId = searchParams.kandidat ?? list[0]?.[0];
  const active = activeId ? threads.get(activeId) : undefined;

  if (activeId && active?.unread) await markCompanyMessagesRead(activeId);

  return (
    <>
      <PageHeader title="Meddelanden" description="Er dialog med kandidaterna." />

      {list.length === 0 ? (
        <Empty>
          Inga meddelanden ännu. Öppna ett CV i CVArkivet och skicka det första meddelandet.
        </Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <h2 className="h2 mb-3">Kandidater</h2>
            <ul className="space-y-1">
              {list.map(([id, t]) => (
                <li key={id}>
                  <Link
                    href={`/foretag/meddelanden?kandidat=${id}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      id === activeId ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>
                      <span className="font-medium">{t.name}</span>
                      {t.headline && <span className="block text-xs text-slate-500">{t.headline}</span>}
                    </span>
                    {t.unread > 0 && <Badge tone="blue">{t.unread} ny</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="lg:col-span-2">
            {active ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="h2">{active.name}</h2>
                  <Link
                    href={`/foretag/cvarkivet/${activeId}`}
                    className="text-sm text-brand-600 hover:underline"
                  >
                    Öppna CV →
                  </Link>
                </div>

                <div className="mb-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                  {active.msgs.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                        m.senderType === 'COMPANY'
                          ? 'ml-auto bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p
                        className={`mt-1 text-[11px] ${
                          m.senderType === 'COMPANY' ? 'text-brand-100' : 'text-slate-500'
                        }`}
                      >
                        {formatDateTime(m.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>

                <form action={messageCandidate} className="flex gap-2">
                  <input type="hidden" name="userId" value={activeId} />
                  <input name="body" placeholder="Skriv ett meddelande…" className="input" />
                  <button className="btn-primary shrink-0" type="submit">
                    Skicka
                  </button>
                </form>
              </>
            ) : (
              <Empty>Välj en kandidat.</Empty>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
