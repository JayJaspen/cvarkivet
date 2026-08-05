import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { pris, prisInklMoms } from '@/lib/data';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { godkannForetag, toggleCompanySuspended } from '@/app/actions/admin';
import { contains } from '@/lib/search';

export const dynamic = 'force-dynamic';

export default async function AdminCompanies({
  searchParams,
}: {
  searchParams: { q?: string; plan?: string; status?: string; granskning?: string };
}) {
  await requireAdmin();
  const { q, plan, status, granskning } = searchParams;

  const companies = await prisma.company.findMany({
    where: {
      ...(plan ? { subscription: plan } : {}),
      ...(granskning ? { status: granskning } : {}),
      ...(status === 'avstangda' ? { suspended: true } : {}),
      ...(status === 'aktiva' ? { suspended: false } : {}),
      ...(q
        ? {
            OR: [{ name: contains(q) }, { orgNumber: contains(q) }, { email: contains(q) }],
          }
        : {}),
    },
    include: { _count: { select: { jobAds: true, cvViews: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const [betalande, vantande] = await Promise.all([
    prisma.company.findMany({
      where: { suspended: false, subscription: { not: 'NONE' } },
      select: { companyType: true, subscription: true },
    }),
    prisma.company.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } }),
  ]);

  const arsabonnemang = betalande.filter((c) => c.subscription === 'YEARLY');
  const manadsabonnemang = betalande.filter((c) => c.subscription === 'MONTHLY');

  // Årsvärde av beståndet: årsabonnemangen som de är, månadsabonnemangen gånger tolv.
  const arsvarde =
    arsabonnemang.reduce((s, c) => s + pris(c.companyType, 'YEARLY'), 0) +
    manadsabonnemang.reduce((s, c) => s + pris(c.companyType, 'MONTHLY') * 12, 0);

  const manadsintakt = manadsabonnemang.reduce(
    (s, c) => s + pris(c.companyType, 'MONTHLY'),
    0
  );

  return (
    <>
      <PageHeader
        title="Registrerade företag"
        description="Filtrera på prenumeration för att ta fram faktureringsunderlag."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="muted">Årsabonnemang</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">{arsabonnemang.length}</p>
          <p className="mt-1 text-xs text-sand-500">Faktureras en gång per år</p>
        </Card>
        <Card>
          <p className="muted">Månadsabonnemang</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">{manadsabonnemang.length}</p>
          <p className="mt-1 text-xs text-sand-500">
            {manadsintakt.toLocaleString('sv-SE')} kr att fakturera denna månad
          </p>
        </Card>
        <Card>
          <p className="muted">Årsvärde av beståndet</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">
            {arsvarde.toLocaleString('sv-SE')} kr
          </p>
          <p className="mt-1 text-xs text-sand-500">
            exkl. moms · {prisInklMoms(arsvarde).toLocaleString('sv-SE')} kr inkl. moms
          </p>
        </Card>
      </div>

      {vantande.length > 0 && (
        <Card className="mb-6 border-amber-300 bg-amber-50">
          <h2 className="h2">
            {vantande.length} {vantande.length === 1 ? 'företag väntar' : 'företag väntar'} på
            granskning
          </h2>
          <p className="muted mt-1">
            Ogranskade företag syns inte för kandidaterna och kommer inte åt något CV.
          </p>

          <div className="mt-4 space-y-3">
            {vantande.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-amber-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sand-900">{c.name}</p>
                  <p className="muted">
                    {c.orgNumber} · {c.municipality} · registrerad {formatDate(c.createdAt)}
                  </p>
                  <p className="muted">
                    {c.contactName} · {c.email} · {c.phone}
                  </p>
                  <p className="muted">{c.address}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/foretag/${c.id}`} className="btn-secondary">
                    Granska
                  </Link>
                  <form action={godkannForetag}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="btn-primary" type="submit">
                      Godkänn
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <form className="grid gap-3 sm:grid-cols-5">
          <div className="sm:col-span-2">
            <label className="label">Sök</label>
            <input
              name="q"
              defaultValue={q ?? ''}
              placeholder="Företagsnamn, orgnr eller e-post"
              className="input"
            />
          </div>
          <div>
            <label className="label">Prenumeration</label>
            <select name="plan" defaultValue={plan ?? ''} className="input">
              <option value="">Alla</option>
              <option value="YEARLY">Årsabonnemang</option>
              <option value="MONTHLY">Månadsabonnemang</option>
              <option value="NONE">Ingen</option>
            </select>
          </div>
          <div>
            <label className="label">Granskning</label>
            <select name="granskning" defaultValue={granskning ?? ''} className="input">
              <option value="">Alla</option>
              <option value="PENDING">Väntar</option>
              <option value="APPROVED">Godkända</option>
              <option value="REJECTED">Avslagna</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="btn-primary flex-1" type="submit">
              Filtrera
            </button>
            <Link href="/admin/foretag" className="btn-secondary">
              Rensa
            </Link>
          </div>
        </form>
      </Card>

      {companies.length === 0 ? (
        <Empty>Inga företag matchar filtret.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-sand-200 bg-white">
          <table className="min-w-full">
            <thead className="border-b border-sand-200 bg-sand-50">
              <tr>
                <th className="th">Företag</th>
                <th className="th">Org.nr</th>
                <th className="th">Kontakt</th>
                <th className="th">Prenumeration</th>
                <th className="th">Faktureras</th>
                <th className="th">Annonser</th>
                <th className="th">Lästa CV</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-sand-50">
                  <td className="td">
                    <Link
                      href={`/admin/foretag/${c.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {c.name}
                    </Link>
                    <p className="muted">
                      {c.municipality} · registrerad {formatDate(c.createdAt)}
                    </p>
                  </td>
                  <td className="td">{c.orgNumber}</td>
                  <td className="td">
                    {c.contactName}
                    <p className="muted">{c.email}</p>
                  </td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {c.companyType === 'AGENCY' ? (
                        <Badge tone="pink">Bemanning</Badge>
                      ) : (
                        <Badge>Arbetsgivare</Badge>
                      )}
                      {c.subscription === 'NONE' ? (
                        <Badge>Ingen</Badge>
                      ) : (
                        <Badge tone="green">
                          {c.subscription === 'YEARLY' ? 'År' : 'Månad'} ·{' '}
                          {pris(c.companyType, c.subscription as 'YEARLY' | 'MONTHLY').toLocaleString('sv-SE')} kr
                        </Badge>
                      )}
                    </div>
                    {c.subscriptionStarted && (
                      <p className="muted">sedan {formatDate(c.subscriptionStarted)}</p>
                    )}
                    {c.subscriptionEndsAt && (
                      <p className="muted">
                        {c.cancelledAt ? 'uppsagt, gäller t.o.m.' : 'gäller t.o.m.'}{' '}
                        {formatDate(c.subscriptionEndsAt)}
                      </p>
                    )}
                    {c.blockedUntil && c.blockedUntil > new Date() && (
                      <p className="muted">Karens t.o.m. {formatDate(c.blockedUntil)}</p>
                    )}
                  </td>
                  <td className="td">
                    {c.subscription === 'NONE' ? (
                      <span className="muted">–</span>
                    ) : c.invoiceMethod === 'EMAIL' ? (
                      <>
                        <Badge tone="blue">PDF via e-post</Badge>
                        <p className="muted mt-0.5">{c.invoiceEmail}</p>
                      </>
                    ) : c.invoiceMethod === 'PAPER' ? (
                      <>
                        <Badge>Pappersfaktura</Badge>
                        <p className="muted mt-0.5 whitespace-pre-wrap">{c.invoiceAddress}</p>
                      </>
                    ) : (
                      <Badge tone="amber">Ej valt</Badge>
                    )}
                    {c.invoiceRef && <p className="muted">Ref: {c.invoiceRef}</p>}
                  </td>
                  <td className="td">{c._count.jobAds}</td>
                  <td className="td">{c._count.cvViews}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {c.status === 'PENDING' && <Badge tone="amber">Väntar granskning</Badge>}
                      {c.status === 'REJECTED' && <Badge tone="red">Avslaget</Badge>}
                      {c.suspended ? (
                        <Badge tone="red">Avstängd</Badge>
                      ) : (
                        c.status === 'APPROVED' && <Badge tone="green">Aktiv</Badge>
                      )}
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex gap-2">
                      <Link href={`/admin/foretag/${c.id}`} className="btn-secondary">
                        Öppna
                      </Link>
                      <form action={toggleCompanySuspended}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className={c.suspended ? 'btn-secondary' : 'btn-danger'} type="submit">
                          {c.suspended ? 'Aktivera' : 'Stäng av'}
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
