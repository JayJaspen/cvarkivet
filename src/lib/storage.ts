import 'server-only';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

/**
 * Filuppladdning för företagslogotyper.
 *
 * I produktion (Vercel) går filerna till Vercel Blob – serverns filsystem är
 * skrivskyddat och nollställs vid varje deploy. Saknas BLOB_READ_WRITE_TOKEN
 * sparas filen lokalt i public/uploads/, vilket räcker vid utveckling.
 */

const MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

export type UploadResult = { url: string } | { error: string };

async function laddaUpp(
  file: File,
  mapp: string,
  prefix: string,
  id: string,
  tillatnaTyper: string[],
  vadHeterDet: string,
  slumpmassigtNamn = false
): Promise<UploadResult> {
  if (file.size > MAX_BYTES) return { error: `${vadHeterDet} får vara max 2 MB.` };

  const ext = ALLOWED[file.type];
  if (!ext || !tillatnaTyper.includes(file.type))
    return {
      error: `${vadHeterDet} måste vara ${tillatnaTyper.includes('image/svg+xml') ? 'PNG, JPG, WEBP eller SVG' : 'PNG, JPG eller WEBP'}.`,
    };

  const filename = `${prefix}-${id}-${Date.now()}.${ext}`;
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    // Vercel Blob – importeras dynamiskt så att lokal utveckling inte kräver paketet.
    const { put } = await import('@vercel/blob');
    const blob = await put(`${mapp}/${filename}`, file, {
      access: 'public',
      token,
      contentType: file.type,
      addRandomSuffix: slumpmassigtNamn,
    });
    return { url: blob.url };
  }

  // I drift på Vercel är filsystemet skrivskyddat. Utan Blob-lagring skulle
  // uppladdningen krascha med ett obegripligt serverfel – bättre att säga ifrån.
  if (process.env.VERCEL)
    return {
      error:
        'Bilduppladdning är inte konfigurerad på servern. Kontakta ' +
        'support så åtgärdar vi det (Vercel Blob saknas).',
    };

  // Lokal utveckling: spara på disk.
  // Obs: `next start` läser innehållet i public/ vid uppstart, så en nyss
  // uppladdad bild syns först efter omstart. Med `npm run dev` fungerar det direkt.
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${filename}` };
}

export function uploadLogo(file: File, companyId: string) {
  return laddaUpp(
    file,
    'logotyper',
    'logo',
    companyId,
    ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
    'Logotypen'
  );
}

/**
 * Profilbild på kandidatens CV.
 *
 * SVG tillåts inte här – en SVG kan innehålla skript, och till skillnad från
 * logotyper laddas de här bilderna upp av vem som helst som skapar ett konto.
 *
 * Filnamnet får ett slumpmässigt tillägg. Bilderna ligger på en publik adress
 * för att kunna visas i webbläsaren, och då ska adressen inte gå att gissa sig
 * till utifrån användarens id.
 */
export function uploadProfilePhoto(file: File, userId: string) {
  return laddaUpp(
    file,
    'profilbilder',
    'foto',
    userId,
    ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    'Profilbilden',
    true
  );
}
