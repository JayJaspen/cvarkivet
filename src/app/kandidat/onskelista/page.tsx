import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { Card, Empty, PageHeader } from '@/components/ui';
import { rostaPaOnskemal, taBortRost } from '@/app/actions/onskelista';
import OnskeForm from './OnskeForm';

export const dynamic = 'force-dynamic';

export default async function KandidatOnskelista() {
  const user = await requireUser();

  const [onskemal, egnaRoster] = await Promise.all([
    prisma.companyWish.findMany({
      where: { fulfilledAt: null, status: { in: ['APPROVED', 'PENDING'] } },
      include: { _count: { select: { votes: true } } },
      orderBy: [{ votes: { _count: 'desc' } }, { name: 'asc' }],
      take: 100,
    }),
    prisma.companyWishVote.findMany({ where: { userId: user.id }, select: { wishId: true } }),
  ]);

  const mina = new Set(egnaRoster.map((r) => r.wishId));

  return (
    <>
      <PageHeader
        title="Önska företag"
        description="Saknar du en arbetsgivare här? Skriv upp dem, så syns de på startsidan. Ju fler som önskar samma företag, desto tyngre väger det när vi hör av oss till dem."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {onskemal.length === 0 ? (
            <Empty>Inga önskemål ännu. Bli först med att lägga till ett företag.</Empty>
          ) : (
            <div className="overflow-hidden rounded-xl border border-sand-200 bg-white">
              {onskemal.map((o) => {
                const harRostat = mina.has(o.id);
                return (
                  <div
                    key={o.id}
                    className="flex items-center gap-4 border-b border-sand-100 px-4 py-3 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sand-900">{o.name}</p>
                      <p className="muted">
                        {o._count.votes} {o._count.votes === 1 ? 'kandidat önskar' : 'kandidater önskar'}
                        {o.website ? ` · ${o.website}` : ''}
                        {o.status === 'PENDING' ? ' · granskas' : ''}
                      </p>
                    </div>

                    <form action={harRostat ? taBortRost : rostaPaOnskemal}>
                      <input type="hidden" name="wishId" value={o.id} />
                      <button
                        className={harRostat ? 'btn-primary' : 'btn-secondary'}
                        type="submit"
                      >
                        {harRostat ? '✓ Du önskar dem' : 'Jag med'}
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <OnskeForm />

          <Card>
            <h2 className="h2 mb-3">Så fungerar det</h2>
            <ul className="space-y-2 text-sm text-sand-600">
              <li>• Listan visas på startsidan, där företag kan se att de är efterfrågade.</li>
              <li>• Nya önskemål granskas innan de syns publikt.</li>
              <li>• När företaget registrerar sig försvinner de från listan.</li>
              <li>• Vi kontaktar de mest önskade företagen.</li>
              <li>• Du kan önska upp till 15 företag.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
