import 'server-only';

/**
 * Anrop mot Claude för matchningspoäng och CV-granskning.
 *
 * Utan ANTHROPIC_API_KEY är AI-funktionerna avstängda och gömda i
 * gränssnittet – ingenting går sönder, funktionerna syns bara inte.
 *
 * Två viktiga principer:
 *
 * 1. Modellen får aldrig se ålder, namn, foto, kön eller andra uppgifter som
 *    inte hör ihop med förmågan att göra jobbet. Det är både ett krav för att
 *    poängen ska vara användbar och ett skydd mot diskriminering.
 *
 * 2. Poängen är ett stöd, inte ett beslut. Den ersätter inte en människa som
 *    läser CV:t, och det ska framgå i gränssnittet.
 */

const API = 'https://api.anthropic.com/v1/messages';

/** Billig modell för matchning, som körs ofta. */
const MODELL_SNABB = 'claude-haiku-4-5-20251001';
/** Bättre modell för CV-granskning, som körs sällan men ska hålla kvalitet. */
const MODELL_NOGGRANN = 'claude-sonnet-5';

export function aiArPakopplad() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Vad modellerna kostar, i US-dollar per miljon tokens.
 *
 * Sonnet har introduktionspris till och med 2026-08-31. Efter det gäller
 * 3 respektive 15 dollar. Datumet står här i koden så att adminvyn räknar
 * rätt av sig själv när priset ändras.
 */
export const MODELLPRIS: Record<string, { in: number; ut: number; efter?: { fran: string; in: number; ut: number } }> = {
  'claude-haiku-4-5-20251001': { in: 1, ut: 5 },
  'claude-sonnet-5': { in: 2, ut: 10, efter: { fran: '2026-09-01', in: 3, ut: 15 } },
};

/** Dollarkurs för att visa kostnad i kronor. Justeras med env om den driftar. */
export const USD_TILL_SEK = Number(process.env.USD_KURS) || 9.6;

/** Kostnad i kronor för ett anrop. Okänd modell räknas som Sonnet, alltså dyrast. */
export function kostnadKronor(
  modell: string,
  inTokens: number,
  utTokens: number,
  tidpunkt = new Date()
): number {
  const p = MODELLPRIS[modell] ?? MODELLPRIS['claude-sonnet-5'];
  const g = p.efter && tidpunkt >= new Date(p.efter.fran) ? p.efter : p;
  const usd = (inTokens / 1_000_000) * g.in + (utTokens / 1_000_000) * g.ut;
  return usd * USD_TILL_SEK;
}

export type Forbrukning = { modell: string; inTokens: number; utTokens: number };

type AnropsResultat<T> =
  | { ok: true; data: T; forbrukning: Forbrukning }
  | { ok: false; error: string; forbrukning?: Forbrukning };

async function anropaClaude<T>(
  modell: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1024
): Promise<AnropsResultat<T>> {
  const nyckel = process.env.ANTHROPIC_API_KEY;
  if (!nyckel) return { ok: false, error: 'AI är inte konfigurerat.' };

  try {
    const svar = await fetch(API, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': nyckel,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modell,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      // Hellre inget svar än en sida som hänger sig
      signal: AbortSignal.timeout(30_000),
    });

    if (!svar.ok) {
      const text = await svar.text();
      console.error('Claude svarade med fel:', svar.status, text);
      return { ok: false, error: 'AI-tjänsten svarade inte som väntat.' };
    }

    const json = await svar.json();
    const innehall: string = json?.content?.[0]?.text ?? '';

    // Verklig förbrukning från API-svaret, inte en gissning.
    const forbrukning: Forbrukning = {
      modell,
      inTokens: Number(json?.usage?.input_tokens) || 0,
      utTokens: Number(json?.usage?.output_tokens) || 0,
    };

    // Modellen ombeds svara med ren JSON, men ibland kommer den inbäddad i text.
    const start = innehall.indexOf('{');
    const slut = innehall.lastIndexOf('}');
    if (start === -1 || slut === -1) {
      console.error('Kunde inte hitta JSON i svaret:', innehall.slice(0, 300));
      // Anropet kostade pengar även om svaret var obrukbart – logga det.
      return { ok: false, error: 'AI-svaret gick inte att tolka.', forbrukning };
    }

    return { ok: true, data: JSON.parse(innehall.slice(start, slut + 1)) as T, forbrukning };
  } catch (err) {
    console.error('Anrop mot Claude misslyckades:', err);
    return { ok: false, error: 'Kunde inte nå AI-tjänsten just nu.' };
  }
}

// --------------------------------------------------------------- Matchning

export type Kandidatunderlag = {
  yrkesrubrik: string | null;
  soker: string | null;
  presentation: string | null;
  personligtBrev: string | null;
  kompetenser: string | null;
  sprak: string | null;
  korkort: string | null;
  kategorier: string[];
  erfarenhet: { titel: string; arbetsgivare: string; fran: string; till: string | null; beskrivning: string | null }[];
  utbildning: { program: string; skola: string; fran: string; till: string | null }[];
};

export type Annonsunderlag = {
  rubrik: string;
  text: string;
  kategori: string;
};

const MATCHNING_SYSTEM = `Du bedömer hur väl en kandidats kompetens och erfarenhet stämmer med en jobbannons.

Regler du måste följa:
- Bedöm ENDAST yrkeskunnande: erfarenhet, kompetenser, utbildning, språk, körkort och bransch.
- Du får INTE väga in eller kommentera ålder, kön, namn, ursprung, utseende, hälsa, familjesituation eller bostadsort. Sådana uppgifter finns inte i underlaget och ska inte gissas.
- Är underlaget tunt ska poängen bli låg och det ska framgå att det beror på att CV:t saknar information, inte på att kandidaten är olämplig.
- Var återhållsam med höga poäng. 80 eller mer ska betyda att kandidaten tydligt uppfyller det annonsen efterfrågar.

Svara med enbart JSON, inget annat:
{"score": <heltal 0-100>, "motivation": "<en till två meningar på svenska, sakligt formulerat>"}`;

export async function beraknaMatchning(
  kandidat: Kandidatunderlag,
  annons: Annonsunderlag
): Promise<AnropsResultat<{ score: number; motivation: string }>> {
  const prompt = `ANNONS
Rubrik: ${annons.rubrik}
Kategori: ${annons.kategori}
Beskrivning:
${annons.text}

KANDIDAT
Yrkesrubrik: ${kandidat.yrkesrubrik ?? 'ej angiven'}
Söker tjänst: ${kandidat.soker ?? 'ej angivet'}
Önskade yrkeskategorier: ${kandidat.kategorier.join(', ') || 'inga angivna'}
Kompetenser: ${kandidat.kompetenser ?? 'ej angivna'}
Språk: ${kandidat.sprak ?? 'ej angivna'}
Körkort: ${kandidat.korkort ?? 'ej angivet'}

Presentation:
${kandidat.presentation ?? 'ingen'}

Personligt brev:
${kandidat.personligtBrev ?? 'inget'}

Arbetslivserfarenhet:
${
  kandidat.erfarenhet.length
    ? kandidat.erfarenhet
        .map(
          (e) =>
            `- ${e.titel} hos ${e.arbetsgivare} (${e.fran}–${e.till ?? 'pågående'})${
              e.beskrivning ? `: ${e.beskrivning}` : ''
            }`
        )
        .join('\n')
    : 'ingen angiven'
}

Utbildning:
${
  kandidat.utbildning.length
    ? kandidat.utbildning.map((u) => `- ${u.program}, ${u.skola} (${u.fran}–${u.till ?? 'pågående'})`).join('\n')
    : 'ingen angiven'
}`;

  const resultat = await anropaClaude<{ score: number; motivation: string }>(
    MODELL_SNABB,
    MATCHNING_SYSTEM,
    prompt,
    400
  );

  if (!resultat.ok) return resultat;

  // Skydda mot orimliga värden från modellen
  const score = Math.max(0, Math.min(100, Math.round(Number(resultat.data.score) || 0)));
  const motivation = String(resultat.data.motivation ?? '').slice(0, 400);
  return { ok: true, data: { score, motivation }, forbrukning: resultat.forbrukning };
}

// ----------------------------------------------------------- CV-granskning

export type Granskningsforslag = {
  rubrik: string;
  forslag: string;
  allvar: 'hog' | 'medel' | 'lag';
};

const GRANSKNING_SYSTEM = `Du är en erfaren och rak rekryterare som ger konkret återkoppling på ett CV.

Så här arbetar du:
- Peka på vad som saknas eller är för vagt, och säg exakt vad kandidaten ska göra i stället.
- Ge hellre fem skarpa förslag än tolv luddiga.
- Kommentera aldrig ålder, kön, ursprung, utseende eller hälsa.
- Skriv på svenska, i du-form, vänligt men utan smicker. Undvik floskler.
- Är CV:t nästan tomt: säg det rakt, och börja med det viktigaste att fylla i.

Svara med enbart JSON:
{
  "completeness": <heltal 0-100, hur komplett CV:t är>,
  "summary": "<två till tre meningar med helhetsomdöme>",
  "suggestions": [
    {"rubrik": "<kort rubrik>", "forslag": "<konkret råd, en till tre meningar>", "allvar": "hog|medel|lag"}
  ]
}`;

export async function granskaCv(
  kandidat: Kandidatunderlag
): Promise<AnropsResultat<{ completeness: number; summary: string; suggestions: Granskningsforslag[] }>> {
  const prompt = `CV ATT GRANSKA

Yrkesrubrik: ${kandidat.yrkesrubrik ?? 'saknas'}
Söker tjänst: ${kandidat.soker ?? 'saknas'}
Yrkeskategorier: ${kandidat.kategorier.join(', ') || 'inga valda'}
Kompetenser: ${kandidat.kompetenser ?? 'saknas'}
Språk: ${kandidat.sprak ?? 'saknas'}
Körkort: ${kandidat.korkort ?? 'saknas'}

Presentation:
${kandidat.presentation ?? 'saknas'}

Personligt brev:
${kandidat.personligtBrev ?? 'saknas'}

Arbetslivserfarenhet:
${
  kandidat.erfarenhet.length
    ? kandidat.erfarenhet
        .map(
          (e) =>
            `- ${e.titel} hos ${e.arbetsgivare} (${e.fran}–${e.till ?? 'pågående'})${
              e.beskrivning ? `: ${e.beskrivning}` : ' — ingen beskrivning'
            }`
        )
        .join('\n')
    : 'saknas helt'
}

Utbildning:
${
  kandidat.utbildning.length
    ? kandidat.utbildning.map((u) => `- ${u.program}, ${u.skola} (${u.fran}–${u.till ?? 'pågående'})`).join('\n')
    : 'saknas helt'
}`;

  const resultat = await anropaClaude<{
    completeness: number;
    summary: string;
    suggestions: Granskningsforslag[];
  }>(MODELL_NOGGRANN, GRANSKNING_SYSTEM, prompt, 1600);

  if (!resultat.ok) return resultat;

  return {
    ok: true,
    forbrukning: resultat.forbrukning,
    data: {
      completeness: Math.max(0, Math.min(100, Math.round(Number(resultat.data.completeness) || 0))),
      summary: String(resultat.data.summary ?? '').slice(0, 800),
      suggestions: (Array.isArray(resultat.data.suggestions) ? resultat.data.suggestions : [])
        .slice(0, 8)
        .map((f) => ({
          rubrik: String(f.rubrik ?? '').slice(0, 120),
          forslag: String(f.forslag ?? '').slice(0, 600),
          allvar: f.allvar === 'hog' || f.allvar === 'medel' ? f.allvar : 'lag',
        })),
    },
  };
}

/** Plockar ihop underlaget som skickas till modellen. Inga känsliga fält följer med. */
export function byggKandidatunderlag(user: {
  headline: string | null;
  seeking: string | null;
  summary: string | null;
  coverLetter: string | null;
  skills: string | null;
  languages: string | null;
  drivingLicense: string | null;
  categories: { category: string }[];
  experiences: {
    title: string;
    employer: string;
    fromDate: string;
    toDate: string | null;
    description: string | null;
  }[];
  educations: { program: string; school: string; fromDate: string; toDate: string | null }[];
}): Kandidatunderlag {
  return {
    yrkesrubrik: user.headline,
    soker: user.seeking,
    presentation: user.summary,
    personligtBrev: user.coverLetter,
    kompetenser: user.skills,
    sprak: user.languages,
    korkort: user.drivingLicense,
    kategorier: user.categories.map((c) => c.category),
    erfarenhet: user.experiences.map((e) => ({
      titel: e.title,
      arbetsgivare: e.employer,
      fran: e.fromDate,
      till: e.toDate,
      beskrivning: e.description,
    })),
    utbildning: user.educations.map((u) => ({
      program: u.program,
      skola: u.school,
      fran: u.fromDate,
      till: u.toDate,
    })),
  };
}

/** Spann som företaget filtrerar kandidater på. */
export const MATCHSPANN = [
  { id: '81-100', namn: '81–100 %', min: 81, max: 100 },
  { id: '61-80', namn: '61–80 %', min: 61, max: 80 },
  { id: '41-60', namn: '41–60 %', min: 41, max: 60 },
  { id: '21-40', namn: '21–40 %', min: 21, max: 40 },
  { id: '0-20', namn: '0–20 %', min: 0, max: 20 },
] as const;

export function spannFor(score: number) {
  return MATCHSPANN.find((s) => score >= s.min && score <= s.max) ?? MATCHSPANN[4];
}
