import { requireAdmin } from '@/lib/session';
import { Card, Notice, PageHeader } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import AdminPasswordForm from './AdminPasswordForm';

export const dynamic = 'force-dynamic';

export default async function MittKonto() {
  const admin = await requireAdmin();

  return (
    <>
      <PageHeader
        title="Mitt konto"
        description="Adminkontot har full åtkomst till samtliga CV och företagsuppgifter."
      />

      <Notice tone="amber" title="Skydda det här kontot">
        Med adminkontot kan man läsa alla registrerade CV. Använd ett långt och unikt
        lösenord som du inte använder någon annanstans, och dela det aldrig.
      </Notice>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminPasswordForm />
        </div>

        <Card>
          <h2 className="h2 mb-3">Kontouppgifter</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Namn</dt>
              <dd>{admin.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">E-postadress</dt>
              <dd>{admin.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Skapat</dt>
              <dd>{formatDate(admin.createdAt)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            Adminkonton kan inte återställa lösenord via e-post. Tappar du lösenordet
            måste ett nytt konto skapas direkt mot databasen.
          </p>
        </Card>
      </div>
    </>
  );
}
