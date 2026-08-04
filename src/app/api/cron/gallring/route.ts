import { NextResponse } from 'next/server';
import { korGallring } from '@/lib/retention';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Nattlig gallring av inaktiva konton.
 *
 * Anropas av Vercel Cron enligt schemat i vercel.json. Vercel skickar
 * automatiskt med CRON_SECRET som Bearer-token, så ingen utomstående kan
 * trigga jobbet.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ fel: 'Obehörig' }, { status: 401 });
    }
  }

  const resultat = await korGallring();

  console.log('Gallring körd:', resultat);

  return NextResponse.json({
    körd: new Date().toISOString(),
    ...resultat,
  });
}
