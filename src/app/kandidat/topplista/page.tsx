import { requireUser } from '@/lib/session';
import { hamtaTopplista } from '@/lib/topplista';
import Topplista from '@/components/Topplista';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function KandidatTopplista() {
  await requireUser();
  const platser = await hamtaTopplista();

  return (
    <>
      <PageHeader
        title="Mest följda företag"
        description="De 50 företag som flest kandidater har markerat som favorit. Ett bra ställe att börja om du undrar vilka arbetsgivare andra håller ögonen på."
      />
      <Topplista platser={platser} lankbas="/kandidat/foretag" />
    </>
  );
}
