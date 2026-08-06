import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { satStatusOnskemal } from '@/app/actions/onskelista';
import OnskeRad from './OnskeRad';

export const dynamic = 'force-dynamic';

export default async function AdminOnskelista() {
  await requireAdmin();

  const onskemal = await prisma.companyWish.findMany({
    include: { _count: { select: { votes: true } } },
    orderBy: [{ fulfilledAt: 'asc' }, { votes: { _count: 'desc' } }, { createdAt: 'desc' }],
  });

  const attGranska = onskemal.filter((o) => o.status === 'PENDING' && !o.fulfilledAt);
  const publika = onskemal.filter((o) => o.status === 'APPROVED' && !o.fulfilledAt);
  const dolda = onskemal.filter((o) => o.status === 'HIDDEN' && !o.fulfilledAt);
  const uppfyllda = onskemal.filter((o) => o.fulfilledAt);

  const alla = onskemal.map((o) => ({ id: o.id, name: o.name }));

  return (
    <>
      <PageHeader
        title="Önskelistan"
        description="Företag som kandidaterna vill se på CVArkivet. Nya önskemål syns publikt först när du godkänt dem – listan ligger på startsidan och ska inte kunna fyllas med vad som helst."
      />

      {attGranska.length > 0 && (
        <Card className="mb-6 border-amber-300 bg-amber-50">
          <h2 className="h2 mb-1">
            {attGranska.length} {attGranska.length === 1 ? 'önskemål väntar' : 'önskemål väntar'} på
            granskning
          </h2>
          <p className="muted mb-4">
            Kontrollera stavningen innan du godkänner. Ser du en dubblett, slå ihop den med den
            befintliga posten i stället för att godkänna båda.
          </p>
          <div className="space-y-3">
            {attGranska.map((o) => (
              <OnskeRad key={o.id} onskemal={{ ...o, roster: o._count.votes }} alla={alla} />
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <h2 className="h2 mb-4">Publika på startsidan ({publika.length})</h2>
        {publika.length === 0 ? (
          <Empty>Inget godkänt önskemål ännu.</Empty>
        ) : (
          <div className="space-y-3">
            {publika.map((o) => (
              <OnskeRad key={o.id} onskemal={{ ...o, roster: o._count.votes }} alla={alla} />
            ))}
          </div>
        )}
      </Card>

      {dolda.length > 0 && (
        <Card className="mb-6">
          <h2 className="h2 mb-4">Dolda ({dolda.length})</h2>
          <div className="space-y-3">
            {dolda.map((o) => (
              <OnskeRad key={o.id} onskemal={{ ...o, roster: o._count.votes }} alla={alla} />
            ))}
          </div>
        </Card>
      )}

      {uppfyllda.length > 0 && (
        <Card>
          <h2 className="h2 mb-1">Registrerade sig ({uppfyllda.length})</h2>
          <p className="muted mb-4">
            De här företagen fanns på listan och har nu skapat konto. De visas inte längre
            publikt.
          </p>
          <ul className="space-y-2 text-sm">
            {uppfyllda.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <b>{o.name}</b> · {o._count.votes}{' '}
                  {o._count.votes === 1 ? 'önskade' : 'önskade'}
                </span>
                <span className="flex items-center gap-2">
                  <Badge tone="green">Registrerade {formatDate(o.fulfilledAt)}</Badge>
                  <form action={satStatusOnskemal}>
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="status" value="HIDDEN" />
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
