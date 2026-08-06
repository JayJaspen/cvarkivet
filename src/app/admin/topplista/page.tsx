import { requireAdmin } from '@/lib/session';
import { hamtaTopplista } from '@/lib/topplista';
import Topplista from '@/components/Topplista';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminTopplista() {
  await requireAdmin();
  const platser = await hamtaTopplista();

  return (
    <>
      <PageHeader
        title="Mest följda företag"
        description="Samma lista som kandidater och företag ser. Bara godkända och aktiva företag räknas."
      />
      <Topplista platser={platser} lankbas="/admin/foretag" />
    </>
  );
}
