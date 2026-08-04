import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { korGallringManuellt, toggleUserSuspended } from '@/app/actions/admin';
import { contains } from '@/lib/search';
import { gallringsStatus, INAKTIV_MANADER, VARNING_DAGAR_INNAN } from '@/lib/retention';
import { Notice } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: {
    q?: string;
    status?: string;
    gallring?: string;
    varnade?: string;
    raderade?: string;
    foretag?: string;
  };
}) {
  await requireAdmin();
  const { q, status } = searchParams;
  const gallring = await gallringsStatus();

  const users = await prisma.user.findMany({
    where: {
      ...(status === 'avstangda' ? { suspended: true } : {}),
      ...(status === 'aktiva' ? { suspended: false } : {}),
      ...(q
        ? {
            OR: [{ firstName: contains(q) }, { lastName: contains(q) }, { email: contains(q) }],
          }
        : {}),
    },
    include: {
      _count: { select: { cvViews: true, companyVisits: true, applications: true } },
      categories: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.user.count();
  const suspended = await prisma.user.count({ where: { suspended: true } });

  return (
    <>
      <PageHeader
        title="Registrerade användare"
        description={`${total} konton totalt, varav ${suspended} avstängda.`}
      />

      {searchParams.gallring && (
        <Notice
          tone={searchParams.gallring === 'torr' ? 'blue' : 'green'}
          title={
            searchParams.gallring === 'torr'
              ? 'Torrkörning – ingenting har ändrats'
              : 'Gallringen är körd'
          }
        >
          {searchParams.varnade} kandidater {searchParams.gallring === 'torr' ? 'skulle varnas' : 'varnades'},{' '}
          {searchParams.raderade} kandidater och {searchParams.foretag} företagskonton{' '}
          {searchParams.gallring === 'torr' ? 'skulle raderas' : 'raderades'}.
        </Notice>
      )}

      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="h2">Gallring av inaktiva konton</h2>
            <p className="muted mt-1 max-w-xl">
              Konton som varit inaktiva i {INAKTIV_MANADER} månader raderas automatiskt varje natt,
              enligt integritetspolicyn. Kandidaten varnas via mail {VARNING_DAGAR_INNAN} dagar
              innan och slipper radering genom att logga in.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span>
                <b>{gallring.straxRaderade}</b> kandidater inom varningsfönstret
              </span>
              <span>
                <b>{gallring.varnade}</b> varnade och ej återaktiverade
              </span>
              <span>
                <b>{gallring.foretagStraxRaderade}</b> företagskonton utan prenumeration att radera
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <form action={korGallringManuellt}>
              <input type="hidden" name="lage" value="torr" />
              <button className="btn-secondary" type="submit">
                Testkör
              </button>
            </form>
            <form action={korGallringManuellt}>
              <input type="hidden" name="lage" value="skarp" />
              <button className="btn-danger" type="submit">
                Kör gallringen nu
              </button>
            </form>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <form className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="label">Sök</label>
            <input name="q" defaultValue={q ?? ''} placeholder="Namn eller e-post" className="input" />
          </div>
          <div>
            <label className="label">Status</label>
            <select name="status" defaultValue={status ?? ''} className="input">
              <option value="">Alla</option>
              <option value="aktiva">Aktiva</option>
              <option value="avstangda">Avstängda</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="btn-primary flex-1" type="submit">
              Filtrera
            </button>
            <Link href="/admin/anvandare" className="btn-secondary">
              Rensa
            </Link>
          </div>
        </form>
      </Card>

      {users.length === 0 ? (
        <Empty>Inga användare matchar filtret.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th">Namn</th>
                <th className="th">E-post</th>
                <th className="th">Telefon</th>
                <th className="th">Registrerad / aktiv</th>
                <th className="th">CV-visningar</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="td">
                    <Link
                      href={`/admin/anvandare/${u.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {u.firstName} {u.lastName}
                    </Link>
                    <p className="muted">{u.headline || '–'}</p>
                  </td>
                  <td className="td">{u.email}</td>
                  <td className="td">{u.phone}</td>
                  <td className="td">
                    {formatDate(u.createdAt)}
                    <p className="muted">Aktiv {formatDate(u.lastLoginAt ?? u.createdAt)}</p>
                  </td>
                  <td className="td">{u._count.cvViews}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {u.suspended ? (
                        <Badge tone="red">Avstängd</Badge>
                      ) : u.activelyLooking ? (
                        <Badge tone="green">Söker aktivt</Badge>
                      ) : (
                        <Badge>Passiv</Badge>
                      )}
                      {u.retentionWarningAt && <Badge tone="amber">Varnad om gallring</Badge>}
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex gap-2">
                      <Link href={`/admin/anvandare/${u.id}`} className="btn-secondary">
                        Öppna
                      </Link>
                      <form action={toggleUserSuspended}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className={u.suspended ? 'btn-secondary' : 'btn-danger'} type="submit">
                          {u.suspended ? 'Aktivera' : 'Stäng av'}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
