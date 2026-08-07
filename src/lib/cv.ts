import type { Prisma } from '@prisma/client';

/**
 * Vad räknas som ett ifyllt CV?
 *
 * Ett konto utan innehåll är osynligt i praktiken: det säger ingenting om
 * personen och är värdelöst att söka i. Vi kräver därför minst *en* uppgift
 * som beskriver kandidaten yrkesmässigt.
 *
 * Enbart valda kommuner eller löneanspråk räcker inte – det säger inget om
 * vad personen kan. Och att `cvUpdatedAt` är satt duger inte heller som mått,
 * eftersom den sätts även när någon sparar ett helt tomt formulär.
 *
 * Tomma fält sparas som null (se `updateCv` i actions/user.ts), så `not: null`
 * är ett tillförlitligt test. Sparas de någon gång som tomma strängar i
 * stället måste det här villkoret ändras.
 */
export const CV_HAR_INNEHALL: Prisma.UserWhereInput = {
  OR: [
    { headline: { not: null } },
    { seeking: { not: null } },
    { summary: { not: null } },
    { coverLetter: { not: null } },
    { skills: { not: null } },
    { experiences: { some: {} } },
    { educations: { some: {} } },
    { categories: { some: {} } },
  ],
};

/**
 * Samma bedömning, men på en redan hämtad kandidat – för att kunna märka upp
 * tomma profiler i listan i stället för att bara dölja dem.
 */
export function cvHarInnehall(u: {
  headline?: string | null;
  seeking?: string | null;
  summary?: string | null;
  coverLetter?: string | null;
  skills?: string | null;
  experiences?: unknown[];
  educations?: unknown[];
  categories?: unknown[];
}): boolean {
  return Boolean(
    u.headline ||
      u.seeking ||
      u.summary ||
      u.coverLetter ||
      u.skills ||
      u.experiences?.length ||
      u.educations?.length ||
      u.categories?.length
  );
}

/**
 * Hur komplett ett CV är, och vad som saknas.
 *
 * Åtta punkter som var och en gör kandidaten mer sökbar. Poängen är inte att
 * mäta exakt utan att ge kandidaten något att fylla i – ett CV som är 40 %
 * klart lockar mer till handling än ett tomt formulär utan återkoppling.
 *
 * Ordningen är avsiktlig: det som står först betyder mest för om någon
 * hittar dig i sökningen.
 */
export function cvStatus(u: {
  headline?: string | null;
  seeking?: string | null;
  skills?: string | null;
  summary?: string | null;
  homeMunicipality?: string | null;
  categories?: unknown[];
  municipalities?: unknown[];
  experiences?: unknown[];
}): { procent: number; saknas: string[]; klara: number; totalt: number } {
  const punkter: { klar: boolean; text: string }[] = [
    { klar: Boolean(u.headline), text: 'Yrkesrubrik' },
    { klar: Boolean(u.seeking), text: 'Vilken tjänst du söker' },
    { klar: Boolean(u.skills), text: 'Kompetenser' },
    { klar: Boolean(u.categories?.length), text: 'Minst en jobbkategori' },
    { klar: Boolean(u.homeMunicipality), text: 'Hemmahörande kommun' },
    { klar: Boolean(u.experiences?.length), text: 'Minst en arbetslivserfarenhet' },
    { klar: Boolean(u.summary), text: 'Kort presentation' },
    { klar: Boolean(u.municipalities?.length), text: 'Kommuner du söker jobb i' },
  ];

  const klara = punkter.filter((p) => p.klar).length;

  return {
    procent: Math.round((klara / punkter.length) * 100),
    saknas: punkter.filter((p) => !p.klar).map((p) => p.text),
    klara,
    totalt: punkter.length,
  };
}
