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

export async function uploadLogo(file: File, companyId: string): Promise<UploadResult> {
  if (file.size > MAX_BYTES) return { error: 'Logotypen får vara max 2 MB.' };

  const ext = ALLOWED[file.type];
  if (!ext) return { error: 'Logotypen måste vara PNG, JPG, WEBP eller SVG.' };

  const filename = `logo-${companyId}-${Date.now()}.${ext}`;
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    // Vercel Blob – importeras dynamiskt så att lokal utveckling inte kräver paketet.
    const { put } = await import('@vercel/blob');
    const blob = await put(`logotyper/${filename}`, file, {
      access: 'public',
      token,
      contentType: file.type,
      addRandomSuffix: false,
    });
    return { url: blob.url };
  }

  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${filename}` };
}
