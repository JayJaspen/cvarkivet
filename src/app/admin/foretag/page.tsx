import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { PLANER, planNamn, prisInklMoms } from '@/lib/data';
import { Badge, Card, Empty, PageHeader } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { toggleCompanySuspended } from '@/app/actions/admin';
import { contains } from '@/lib/search';

export const dynamic = 'force-dynamic';

export default async function AdminCompanies({
  searchParams,
}: {
  searchParams: { q?: string; plan?: string; status?: string };
}) {
  await requireAdmin();
  const { q, plan, status } = searchParams;

  const companies = await prisma.company.findMany({
    where: {
      ...(plan ? { subscription: plan } : {}),
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

  const [cvCount, adsCount] = await Promise.all([
    prisma.company.count({ where: { subscription: 'CV', suspended: false } }),
    prisma.company.count({ where: { subscription: 'CV_ADS', suspended: false } }),
  ]);

  const månadsintäkt = cvCount * PLANER.CV.pris + adsCount * PLANER.CV_ADS.pris;

  return (
    <>
      <PageHeader
        title="Registrerade företag"
        description="Filtrera på prenumeration för att ta fram faktureringsunderlag."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="muted">CV-prenumeration (299 kr)</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">{cvCount}</p>
        </Card>
        <Card>
          <p className="muted">CV + Annonspaket (499 kr)</p>
          <p className="mt-1 text-3xl font-bold text-brand-600">{adsCount}</p>
        </Card>
        <Card>
          <p className="muted">Att fakturera per månad</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">
            {månadsintäkt.toLocaleString('sv-SE')} kr
          </p>
          <p className="mt-1 text-xs text-slate-500">
            exkl. moms · {prisInklMoms(månadsintäkt).toLocaleString('sv-SE')} kr inkl. moms
          </p>
        </Card>
      </div>

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
              <option value="CV">CV-prenumeration</option>
              <option value="CV_ADS">CV + Annonspaket</option>
              <option value="NONE">Ingen</option>
            </select>
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
            <Link href="/admin/foretag" className="btn-secondary">
              Rensa
            </Link>
          </div>
        </form>
      </Card>

      {companies.length === 0 ? (
        <Empty>Inga företag matchar filtret.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th">Företag</th>
                <th className="th">Org.nr</th>
                <th className="th">Kontakt</th>
                <th className="th">Prenumeration</th>
                <th className="th">Annonser</th>
                <th className="th">Lästa CV</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
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
                    {c.subscription === 'NONE' ? (
                      <Badge>Ingen</Badge>
                    ) : (
                      <Badge tone="green">{planNamn(c.subscription)}</Badge>
                    )}
                    {c.subscriptionStarted && (
                      <p className="muted">sedan {formatDate(c.subscriptionStarted)}</p>
                    )}
                    {c.blockedUntil && c.blockedUntil > new Date() && (
                      <p className="muted">Karens t.o.m. {formatDate(c.blockedUntil)}</p>
                    )}
                  </td>
                  <td className="td">{c._count.jobAds}</td>
                  <td className="td">{c._count.cvViews}</td>
                  <td className="td">
                    {c.suspended ? <Badge tone="red">Avstängd</Badge> : <Badge tone="green">Aktiv</Badge>}
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
