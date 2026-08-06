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
