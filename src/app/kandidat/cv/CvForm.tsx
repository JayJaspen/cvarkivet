'use client';

import { useTransition } from 'react';
import { useFormState } from 'react-dom';
import { removePhoto, saveCv } from '@/app/actions/user';
import { Card, Field, Select, TextArea } from '@/components/ui';
import MultiSelect from '@/components/MultiSelect';
import SubmitButton from '@/components/SubmitButton';
import { KATEGORIER, KOMMUNER, KOMMUNER_MED_DISTANS } from '@/lib/data';

type UserLite = {
  photoUrl: string | null;
  homeMunicipality: string | null;
  headline: string | null;
  summary: string | null;
  coverLetter: string | null;
  skills: string | null;
  languages: string | null;
  drivingLicense: string | null;
  activelyLooking: boolean;
  salaryExpectation: number | null;
};

export default function CvForm({
  user,
  categories,
  municipalities,
}: {
  user: UserLite;
  categories: string[];
  municipalities: string[];
}) {
  const [state, formAction] = useFormState(saveCv, undefined);
  const [pending, startTransition] = useTransition();

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {state.ok}
        </div>
      )}

      <Card>
        <h2 className="h2 mb-1">Profilbild</h2>
        <p className="muted mb-4">
          Helt frivilligt. Vissa arbetsgivare uppskattar ett ansikte, andra väljer medvetet bort
          bilder för att motverka omedveten diskriminering. Du kan ta bort den när du vill.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          {user.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoUrl}
              alt="Din profilbild"
              className="h-24 w-24 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400">
              👤
            </div>
          )}

          <div className="min-w-0 flex-1">
            <input
              type="file"
              name="photo"
              accept="image/png,image/jpeg,image/webp"
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">
              PNG, JPG eller WEBP. Max 2 MB. Bilden beskärs till en cirkel, så en kvadratisk
              bild blir snyggast.
            </p>

            {user.photoUrl && (
              <button
                type="button"
                onClick={() => startTransition(() => removePhoto())}
                disabled={pending}
                className="mt-2 text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                {pending ? 'Tar bort…' : 'Ta bort bilden'}
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="h2 mb-4">Presentation</h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Yrkesrubrik"
              name="headline"
              defaultValue={user.headline}
              placeholder="t.ex. Lagerarbetare med truckkort"
              hint="Visas överst i företagens sökresultat."
            />
            <Select
              label="Hemmahörande kommun"
              name="homeMunicipality"
              options={KOMMUNER}
              defaultValue={user.homeMunicipality}
              includeBlank
              blankLabel="Välj kommun…"
            />
          </div>
          <TextArea
            label="Kort presentation"
            name="summary"
            rows={3}
            defaultValue={user.summary}
            placeholder="Några meningar om dig själv."
          />
          <TextArea
            label="Personligt brev"
            name="coverLetter"
            rows={8}
            defaultValue={user.coverLetter}
            placeholder="Berätta vad du söker och vad du kan bidra med."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Kompetenser"
              name="skills"
              defaultValue={user.skills}
              placeholder="Excel, truckkort, SAP"
            />
            <Field
              label="Språk"
              name="languages"
              defaultValue={user.languages}
              placeholder="Svenska, engelska"
            />
            <Field
              label="Körkort"
              name="drivingLicense"
              defaultValue={user.drivingLicense}
              placeholder="B"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="h2 mb-1">Inställningar för jobbsökandet</h2>
        <p className="muted mb-4">Styr hur du matchas mot företagens sökningar.</p>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Söker aktivt jobb</label>
              <select
                name="activelyLooking"
                defaultValue={user.activelyLooking ? 'ja' : 'nej'}
                className="input"
              >
                <option value="ja">Ja – jag söker aktivt</option>
                <option value="nej">Nej – öppen för rätt erbjudande</option>
              </select>
            </div>
            <Field
              label="Löneanspråk (kr/mån)"
              name="salaryExpectation"
              defaultValue={user.salaryExpectation ?? ''}
              inputMode="numeric"
              placeholder="Frivilligt"
              hint="Lämna tomt om du inte vill ange något."
            />
          </div>

          <MultiSelect
            name="categories"
            label="Vilken typ av jobb söker du?"
            hint="Välj en eller flera kategorier."
            options={KATEGORIER}
            defaultSelected={categories}
            placeholder="Välj kategorier…"
            sokPlaceholder="Sök kategori…"
          />

          <MultiSelect
            name="municipalities"
            label="Aktuella kommuner"
            hint='Välj en eller flera kommuner. "Distans" ligger överst i listan.'
            options={KOMMUNER_MED_DISTANS}
            defaultSelected={municipalities}
            placeholder="Välj kommuner…"
            sokPlaceholder="Sök kommun…"
          />
        </div>

        <div className="mt-6 flex justify-end">
          <SubmitButton>Spara CV</SubmitButton>
        </div>
      </Card>
    </form>
  );
}
