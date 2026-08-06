import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import { markMessagesRead, replyToCompany } from '@/app/actions/user';
import UppdateraMeny from '@/components/UppdateraMeny';

export const dynamic = 'force-dynamic';

export default async function MeddelandenPage({
  searchParams,
}: {
  searchParams: { foretag?: string };
}) {
  const user = await requireUser();

  const all = await prisma.message.findMany({
    where: { userId: user.id },
    include: { company: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const threads = new Map<string, { name: string; msgs: typeof all; unread: number }>();
  for (const m of all) {
    const t = threads.get(m.companyId) ?? { name: m.company.name, msgs: [], unread: 0 };
    t.msgs.push(m);
    if (m.senderType === 'COMPANY' && !m.readAt) t.unread++;
    threads.set(m.companyId, t);
  }

  const list = Array.from(threads.entries());
  const activeId = searchParams.foretag ?? list[0]?.[0];
  const active = activeId ? threads.get(activeId) : undefined;

  const attMarkera = activeId && active?.unread ? active.unread : 0;
  if (activeId && attMarkera) await markMessagesRead(activeId);

  return (
    <>
      {/* Räknaren i sidomenyn beräknas när layouten monteras och blir annars
          kvar tills sidan laddas om helt. */}
      {attMarkera > 0 && <UppdateraMeny />}

      <PageHeader
        title="Meddelanden"
        description="Företag som är intresserade av din profil kontaktar dig här."
      />

      {list.length === 0 ? (
        <Empty>Du har inga meddelanden ännu.</Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <h2 className="h2 mb-3">Konversationer</h2>
            <ul className="space-y-1">
              {list.map(([id, t]) => (
                <li key={id}>
                  <Link
                    href={`/kandidat/meddelanden?foretag=${id}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      id === activeId ? 'bg-brand-50 text-brand-700' : 'hover:bg-sand-50'
                    }`}
                  >
                    <span className="font-medium">{t.name}</span>
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
                    href={`/kandidat/foretag/${activeId}`}
                    className="text-sm text-brand-600 hover:underline"
                  >
                    Se företagsprofil →
                  </Link>
                </div>

                <div className="mb-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                  {active.msgs.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                        m.senderType === 'USER'
                          ? 'ml-auto bg-brand-600 text-white'
                          : 'bg-sand-100 text-sand-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p
                        className={`mt-1 text-[11px] ${
                          m.senderType === 'USER' ? 'text-brand-100' : 'text-sand-500'
                        }`}
                      >
                        {formatDateTime(m.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>

                <form action={replyToCompany} className="flex gap-2">
                  <input type="hidden" name="companyId" value={activeId} />
                  <input name="body" placeholder="Skriv ett svar…" className="input" />
                  <button className="btn-primary shrink-0" type="submit">
                    Skicka
                  </button>
                </form>
              </>
            ) : (
              <Empty>Välj en konversation.</Empty>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
