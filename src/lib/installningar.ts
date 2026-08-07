import 'server-only';
import { prisma } from './db';

/**
 * Driftinställningar som admin styr utan att koden behöver läggas upp på nytt.
 *
 * Lagras i tabellen `Installning` som enkla nyckel/värde-par. Samma tabell
 * används av AI-nödstoppet i `ai-kvot.ts`.
 */

const NYCKEL_STATISTIK = 'visa_publik_statistik';

/**
 * Ska besökare se hur många kandidater, företag och annonser som finns?
 *
 * Avstängt som standard. En marknadsplats med två kandidater ser tommare ut
 * än den är, och siffran gör mer skada än nytta tills den blivit imponerande.
 * Slå på den igen under Admin → Inställningar när det känns rätt.
 */
export async function visaPublikStatistik(): Promise<boolean> {
  const rad = await prisma.installning.findUnique({ where: { nyckel: NYCKEL_STATISTIK } });
  return rad?.varde === 'pa';
}

export async function satVisaPublikStatistik(pa: boolean, andradAv: string) {
  await prisma.installning.upsert({
    where: { nyckel: NYCKEL_STATISTIK },
    create: { nyckel: NYCKEL_STATISTIK, varde: pa ? 'pa' : 'av', andradAv },
    update: { varde: pa ? 'pa' : 'av', andradAv },
  });
}
