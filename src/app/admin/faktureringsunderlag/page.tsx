import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { bolagstypText, fakturasattText, pris, prisInklMoms } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import Utskriftsknapp from './Utskriftsknapp';

export const dynamic = 'force-dynamic';

const kr = (n: number) => n.toLocaleString('sv-SE');

/**
 * Utskriftsvänligt faktureringsunderlag att bocka av mot.
 * Kan skrivas ut eller sparas som PDF via webbläsaren.
 */
export default async function Faktureringsunderlag() {
  await requireAdmin();

  const foretag = await prisma.company.findMany({
    // Pilotkunder debiteras inte och ska inte dyka upp på underlaget.
    where: { suspended: false, subscription: { not: 'NONE' }, isPilot: false },
    orderBy: { name: 'asc' },
  });

  const summa = foretag.reduce((s, c) => s + pris(c.companyType), 0);

  return (
    <div className="bg-white p-6 print:p-0">
      <Utskriftsknapp />

      <header className="mb-6 border-b border-sand-300 pb-4">
        <h1 className="text-2xl font-bold text-sand-900">Faktureringsunderlag</h1>
        <p className="muted mt-1">
          CVArkivet.se · uttaget {formatDate(new Date())} · alla betalande företag,
          årsabonnemang
        </p>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sand-300 text-left">
            <th className="py-2 pr-2 font-semibold">Bockas av</th>
            <th className="py-2 pr-2 font-semibold">Företag</th>
            <th className="py-2 pr-2 font-semibold">Org.nr</th>
            <th className="py-2 pr-2 font-semibold">Typ</th>
            <th className="py-2 pr-2 font-semibold">Faktureras</th>
            <th className="py-2 pr-2 text-right font-semibold">Exkl. moms</th>
            <th className="py-2 text-right font-semibold">Inkl. moms</th>
          </tr>
        </thead>
        <tbody>
          {foretag.map((c) => {
            const belopp = pris(c.companyType);
            return (
              <tr key={c.id} className="break-inside-avoid border-b border-sand-100">
                <td className="py-2 pr-2">
                  <span className="inline-block h-4 w-4 border border-sand-400" />
                </td>
                <td className="py-2 pr-2 font-medium">{c.name}</td>
                <td className="py-2 pr-2">{c.orgNumber}</td>
                <td className="py-2 pr-2">{bolagstypText(c.companyType)}</td>
                <td className="py-2 pr-2">
                  {fakturasattText(c.invoiceMethod)}
                  <span className="block text-xs text-sand-500">
                    {c.invoiceMethod === 'EMAIL' ? c.invoiceEmail : c.invoiceAddress}
                    {c.invoiceRef ? ` · ref ${c.invoiceRef}` : ''}
                  </span>
                </td>
                <td className="py-2 pr-2 text-right">{kr(belopp)} kr</td>
                <td className="py-2 text-right">{kr(prisInklMoms(belopp))} kr</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-sand-400 font-bold">
            <td colSpan={6} className="py-3">
              Summa, {foretag.length} {foretag.length === 1 ? 'företag' : 'företag'}
            </td>
            <td className="py-3 text-right">{kr(summa)} kr</td>
            <td className="py-3 text-right">{kr(prisInklMoms(summa))} kr</td>
          </tr>
        </tfoot>
      </table>

      {foretag.length === 0 && (
        <p className="py-8 text-center text-sand-500">Inga betalande företag i urvalet.</p>
      )}
    </div>
  );
}
