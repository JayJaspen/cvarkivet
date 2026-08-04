'use client';

import { useFormState } from 'react-dom';
import { changePassword, updateProfile } from '@/app/actions/user';
import { Card, Field } from '@/components/ui';
import SubmitButton from '@/components/SubmitButton';

type UserLite = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
};

function Msg({ state }: { state: { error?: string; ok?: string } | undefined }) {
  if (!state) return null;
  if (state.error)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {state.error}
      </div>
    );
  if (state.ok)
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        {state.ok}
      </div>
    );
  return null;
}

export default function ProfileForms({ user }: { user: UserLite }) {
  const [profileState, profileAction] = useFormState(updateProfile, undefined);
  const [pwState, pwAction] = useFormState(changePassword, undefined);

  return (
    <>
      <Card>
        <h2 className="h2 mb-4">Personliga uppgifter</h2>
        <form action={profileAction} className="space-y-4">
          <Msg state={profileState} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Förnamn" name="firstName" required defaultValue={user.firstName} />
            <Field label="Efternamn" name="lastName" required defaultValue={user.lastName} />
            <Field label="E-postadress" name="email" type="email" required defaultValue={user.email} />
            <Field label="Telefonnummer" name="phone" type="tel" required defaultValue={user.phone} />
            <Field
              label="Födelsedatum"
              name="birthDate"
              required
              defaultValue={user.birthDate}
              hint="ÅÅÅÅMMDD. Företagen ser bara din ålder."
            />
          </div>
          <div className="flex justify-end">
            <SubmitButton>Spara uppgifter</SubmitButton>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="h2 mb-4">Byt lösenord</h2>
        <form action={pwAction} className="space-y-4">
          <Msg state={pwState} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Nuvarande lösenord" name="current" type="password" required />
            <Field label="Nytt lösenord" name="next" type="password" required />
            <Field label="Upprepa nytt" name="next2" type="password" required />
          </div>
          <div className="flex justify-end">
            <SubmitButton>Byt lösenord</SubmitButton>
          </div>
        </form>
      </Card>
    </>
  );
}
