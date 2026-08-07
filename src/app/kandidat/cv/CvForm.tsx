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
  seeking: string | null;
  summary: string | null;
  coverLetter: string | null;
  skills: string | null;
  languages: string | null;
  drivingLicense: string | null;
  activelyLooking: boolean;
  salaryExpectation: number | null;
};

/**
 * Formuläret är ordnat efter vad som gör kandidaten sökbar, inte efter vad
 * som känns logiskt att fråga om.
 *
 * Tidigare mötte man profilbild först och därefter ett långt fält för
 * personligt brev – två av tre nyregistrerade fyllde inte i någonting alls.
 * Nu ligger de tre fälten som avgör om någon hittar dig överst, med en egen
 * sparaknapp, och resten är hopfällt under "Fyll på när du har tid".
 *
 * Allt ligger kvar i samma <form>. Ett hopfällt <details> döljer bara visuellt,
 * så fälten skickas med som vanligt och ingenting kan gå förlorat.
 */
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

      {/* Det som avgör om ett företag hittar dig */}
      <Card>
        <h2 className="h2 mb-1">Det viktigaste först</h2>
        <p className="muted mb-5">
          De här fyra fälten avgör om ett företag hittar dig i sökningen. Resten kan du fylla
          på när du har tid.
        </p>

        <div className="space-y-4">
          <Field
            label="Yrkesrubrik"
            name="headline"
            defaultValue={user.headline}
            placeholder="t.ex. Lagerarbetare med truckkort"
            hint="Det första företagen ser om dig."
          />

          <Field
            label="Vilken tjänst söker du?"
            name="seeking"
            defaultValue={user.seeking}
            placeholder="t.ex. Innesäljare"
            maxLength={80}
            hint='Visas som "Söker: Innesäljare" i träfflistan. En tjänstetitel säger mer än "något inom försäljning".'
          />

          <Field
            label="Kompetenser"
            name="skills"
            defaultValue={user.skills}
            placeholder="Excel, truckkort, SAP"
            hint="Skriv som en lista med kommatecken. Företagen söker fritext på det här."
          />

          <MultiSelect
            name="categories"
            label="Vilken typ av jobb söker du?"
            hint="Välj en eller flera kategorier."
            options={KATEGORIER}
            defaultSelected={categories}
            placeholder="Välj kategorier…"
            sokPlaceholder="Sök kategori…"
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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="muted">Du kan spara när som helst och fortsätta senare.</p>
          <SubmitButton>Spara</SubmitButton>
        </div>
      </Card>

      {/* Allt annat – hopfällt så att det inte skrämmer bort någon */}
      <Card>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block text-lg font-semibold text-sand-900">
                Fyll på när du har tid
              </span>
              <span className="muted mt-0.5 block">
                Presentation, personligt brev, språk, körkort, löneanspråk och var du kan
                tänka dig att jobba.
              </span>
            </span>
            <span
              aria-hidden
              className="ml-4 shrink-0 text-sand-400 transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>

          <div className="mt-6 space-y-5 border-t border-sand-200 pt-6">
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

            <div className="grid gap-4 sm:grid-cols-2">
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

            <MultiSelect
              name="municipalities"
              label="Var kan du tänka dig att jobba?"
              hint='Välj en eller flera kommuner. "Distans" ligger överst i listan.'
              options={KOMMUNER_MED_DISTANS}
              defaultSelected={municipalities}
              placeholder="Välj kommuner…"
              sokPlaceholder="Sök kommun…"
            />

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

            <div className="flex justify-end">
              <SubmitButton>Spara</SubmitButton>
            </div>
          </div>
        </details>
      </Card>

      {/* Profilbilden låg först tidigare. Att mötas av "ladda upp en bild"
          som allra första steg är en dålig introduktion till tjänsten. */}
      <Card>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block text-lg font-semibold text-sand-900">
                Profilbild {user.photoUrl && <span className="muted">· uppladdad</span>}
              </span>
              <span className="muted mt-0.5 block">Helt frivilligt.</span>
            </span>
            <span
              aria-hidden
              className="ml-4 shrink-0 text-sand-400 transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>

          <div className="mt-6 border-t border-sand-200 pt-6">
            <p className="muted mb-4">
              Vissa arbetsgivare uppskattar ett ansikte, andra väljer medvetet bort bilder för
              att motverka omedveten diskriminering. Du kan ta bort den när du vill.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {user.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoUrl}
                  alt="Din profilbild"
                  className="h-24 w-24 rounded-full border border-sand-200 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sand-100 text-2xl text-sand-400">
                  ?
                </div>
              )}

              <div className="min-w-0 flex-1">
                <input
                  type="file"
                  name="photo"
                  accept="image/png,image/jpeg,image/webp"
                  className="input"
                />
                <p className="mt-1 text-xs text-sand-500">
                  PNG, JPG eller WEBP. Max 2 MB. Bilden beskärs till en cirkel, så en
                  kvadratisk bild blir snyggast.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <SubmitButton pendingText="Sparar bilden…">Spara bilden</SubmitButton>

                  {user.photoUrl && (
                    <button
                      type="button"
                      onClick={() => startTransition(() => removePhoto())}
                      disabled={pending}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      {pending ? 'Tar bort…' : 'Ta bort bilden'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </details>
      </Card>
    </form>
  );
}
