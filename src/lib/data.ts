// Statiska listor: Sveriges 290 kommuner + jobbkategorier

export const REMOTE = 'Distans';

/**
 * Källistan är grupperad länsvis – lättare att kontrollera mot Sveriges 290 kommuner.
 * Exporten KOMMUNER nedan sorteras om i bokstavsordning innan den används i gränssnittet.
 */
const KOMMUNER_LANSVIS: string[] = [
  // Stockholms län
  'Botkyrka', 'Danderyd', 'Ekerö', 'Haninge', 'Huddinge', 'Järfälla', 'Lidingö',
  'Nacka', 'Norrtälje', 'Nykvarn', 'Nynäshamn', 'Salem', 'Sigtuna', 'Sollentuna',
  'Solna', 'Stockholm', 'Sundbyberg', 'Södertälje', 'Tyresö', 'Täby',
  'Upplands Väsby', 'Upplands-Bro', 'Vallentuna', 'Vaxholm', 'Värmdö', 'Österåker',
  // Uppsala län
  'Enköping', 'Heby', 'Håbo', 'Knivsta', 'Tierp', 'Uppsala', 'Älvkarleby', 'Östhammar',
  // Södermanlands län
  'Eskilstuna', 'Flen', 'Gnesta', 'Katrineholm', 'Nyköping', 'Oxelösund',
  'Strängnäs', 'Trosa', 'Vingåker',
  // Östergötlands län
  'Boxholm', 'Finspång', 'Kinda', 'Linköping', 'Mjölby', 'Motala', 'Norrköping',
  'Söderköping', 'Vadstena', 'Valdemarsvik', 'Ydre', 'Åtvidaberg', 'Ödeshög',
  // Jönköpings län
  'Aneby', 'Eksjö', 'Gislaved', 'Gnosjö', 'Habo', 'Jönköping', 'Mullsjö', 'Nässjö',
  'Sävsjö', 'Tranås', 'Vaggeryd', 'Vetlanda', 'Värnamo',
  // Kronobergs län
  'Alvesta', 'Lessebo', 'Ljungby', 'Markaryd', 'Tingsryd', 'Uppvidinge', 'Växjö', 'Älmhult',
  // Kalmar län
  'Borgholm', 'Emmaboda', 'Hultsfred', 'Högsby', 'Kalmar', 'Mönsterås', 'Mörbylånga',
  'Nybro', 'Oskarshamn', 'Torsås', 'Vimmerby', 'Västervik',
  // Gotlands län
  'Gotland',
  // Blekinge län
  'Karlshamn', 'Karlskrona', 'Olofström', 'Ronneby', 'Sölvesborg',
  // Skåne län
  'Bjuv', 'Bromölla', 'Burlöv', 'Båstad', 'Eslöv', 'Helsingborg', 'Hässleholm',
  'Höganäs', 'Hörby', 'Höör', 'Klippan', 'Kristianstad', 'Kävlinge', 'Landskrona',
  'Lomma', 'Lund', 'Malmö', 'Osby', 'Perstorp', 'Simrishamn', 'Sjöbo', 'Skurup',
  'Staffanstorp', 'Svalöv', 'Svedala', 'Tomelilla', 'Trelleborg', 'Vellinge',
  'Ystad', 'Åstorp', 'Ängelholm', 'Örkelljunga', 'Östra Göinge',
  // Hallands län
  'Falkenberg', 'Halmstad', 'Hylte', 'Kungsbacka', 'Laholm', 'Varberg',
  // Västra Götalands län
  'Ale', 'Alingsås', 'Bengtsfors', 'Bollebygd', 'Borås', 'Dals-Ed', 'Essunga',
  'Falköping', 'Färgelanda', 'Grästorp', 'Gullspång', 'Göteborg', 'Götene',
  'Herrljunga', 'Hjo', 'Härryda', 'Karlsborg', 'Kungälv', 'Lerum', 'Lidköping',
  'Lilla Edet', 'Lysekil', 'Mariestad', 'Mark', 'Mellerud', 'Munkedal', 'Mölndal',
  'Orust', 'Partille', 'Skara', 'Skövde', 'Sotenäs', 'Stenungsund', 'Strömstad',
  'Svenljunga', 'Tanum', 'Tibro', 'Tidaholm', 'Tjörn', 'Tranemo', 'Trollhättan',
  'Töreboda', 'Uddevalla', 'Ulricehamn', 'Vara', 'Vårgårda', 'Vänersborg', 'Åmål', 'Öckerö',
  // Värmlands län
  'Arvika', 'Eda', 'Filipstad', 'Forshaga', 'Grums', 'Hagfors', 'Hammarö',
  'Karlstad', 'Kil', 'Kristinehamn', 'Munkfors', 'Storfors', 'Sunne', 'Säffle',
  'Torsby', 'Årjäng',
  // Örebro län
  'Askersund', 'Degerfors', 'Hallsberg', 'Hällefors', 'Karlskoga', 'Kumla', 'Laxå',
  'Lekeberg', 'Lindesberg', 'Ljusnarsberg', 'Nora', 'Örebro',
  // Västmanlands län
  'Arboga', 'Fagersta', 'Hallstahammar', 'Kungsör', 'Köping', 'Norberg', 'Sala',
  'Skinnskatteberg', 'Surahammar', 'Västerås',
  // Dalarnas län
  'Avesta', 'Borlänge', 'Falun', 'Gagnef', 'Hedemora', 'Leksand', 'Ludvika',
  'Malung-Sälen', 'Mora', 'Orsa', 'Rättvik', 'Smedjebacken', 'Säter', 'Vansbro', 'Älvdalen',
  // Gävleborgs län
  'Bollnäs', 'Gävle', 'Hofors', 'Hudiksvall', 'Ljusdal', 'Nordanstig', 'Ockelbo',
  'Ovanåker', 'Sandviken', 'Söderhamn',
  // Västernorrlands län
  'Härnösand', 'Kramfors', 'Sollefteå', 'Sundsvall', 'Timrå', 'Ånge', 'Örnsköldsvik',
  // Jämtlands län
  'Berg', 'Bräcke', 'Härjedalen', 'Krokom', 'Ragunda', 'Strömsund', 'Åre', 'Östersund',
  // Västerbottens län
  'Bjurholm', 'Dorotea', 'Lycksele', 'Malå', 'Nordmaling', 'Norsjö', 'Robertsfors',
  'Skellefteå', 'Sorsele', 'Storuman', 'Umeå', 'Vilhelmina', 'Vindeln', 'Vännäs', 'Åsele',
  // Norrbottens län
  'Arjeplog', 'Arvidsjaur', 'Boden', 'Gällivare', 'Haparanda', 'Jokkmokk', 'Kalix',
  'Kiruna', 'Luleå', 'Pajala', 'Piteå', 'Älvsbyn', 'Överkalix', 'Övertorneå',
];

/**
 * Alla 290 kommuner i bokstavsordning enligt svensk sorteringsordning,
 * så att å, ä och ö hamnar sist i stället för bland a och o.
 */
export const KOMMUNER: string[] = [...KOMMUNER_LANSVIS].sort((a, b) =>
  a.localeCompare(b, 'sv')
);

/** Kommuner + "Distans" överst – används i CV-inställningar och filter */
export const KOMMUNER_MED_DISTANS: string[] = [REMOTE, ...KOMMUNER];

export const KATEGORIER: string[] = [
  'Administration & kontor',
  'Bank, finans & försäkring',
  'Bygg & anläggning',
  'Chef & ledning',
  'Data & IT',
  'Design & formgivning',
  'Ekonomi & redovisning',
  'Fastighet & förvaltning',
  'Försäljning & detaljhandel',
  'Hotell, restaurang & turism',
  'Hälso- & sjukvård',
  'Industri & tillverkning',
  'Installation, drift & underhåll',
  'Juridik',
  'Kultur, media & journalistik',
  'Kundtjänst & support',
  'Lager & logistik',
  'Marknadsföring & kommunikation',
  'Naturbruk, skog & lantbruk',
  'Pedagogik & utbildning',
  'Personal & HR',
  'Rekrytering & bemanning',
  'Säkerhet & bevakning',
  'Socialt arbete & omsorg',
  'Städ & lokalvård',
  'Teknik & ingenjör',
  'Transport & fordon',
  'Övrigt',
];

/**
 * Adressen användare och företag hänvisas till i felmeddelanden och mail.
 * Måste vara en adress du faktiskt läser – ändra här så slår det igenom överallt.
 */
export const SUPPORT_EPOST = 'support@cvarkivet.se';

/** Alla priser anges exklusive moms (B2B-standard). */
export const MOMSSATS = 0.25;

/** Bolagstyp – styr vilket pris som gäller. */
export const BOLAGSTYPER = {
  EMPLOYER: {
    id: 'EMPLOYER',
    namn: 'Arbetsgivare',
    beskrivning: 'Vi rekryterar till vår egen verksamhet.',
  },
  AGENCY: {
    id: 'AGENCY',
    namn: 'Bemannings- eller rekryteringsföretag',
    beskrivning: 'Vi rekryterar eller hyr ut personal åt andra företag.',
  },
} as const;

export function bolagstypText(id: string) {
  return (BOLAGSTYPER as Record<string, { namn: string }>)[id]?.namn ?? id;
}

/**
 * Priser per bolagstyp, exklusive moms. Ett enda abonnemang: helår.
 * Alla betalande företag får både tillgång till CVArkivet och egna annonser.
 *
 * Månadsbetalning togs bort i augusti 2026. Befintliga poster i historiken
 * kan fortfarande vara märkta MONTHLY, så läsande kod måste tåla det –
 * men inget nytt abonnemang kan tecknas per månad.
 */
export const PRISER = {
  EMPLOYER: { YEARLY: 4990 },
  AGENCY: { YEARLY: 9990 },
} as const;

export function pris(companyType: string, _period: 'YEARLY' = 'YEARLY') {
  const typ = companyType === 'AGENCY' ? 'AGENCY' : 'EMPLOYER';
  return PRISER[typ].YEARLY;
}

/** Vad ett år kostar per månad räknat, till hjälp i säljtexterna. */
export function manadskostnad(companyType: string) {
  return Math.round(pris(companyType) / 12);
}

export const PERIODER = {
  YEARLY: { id: 'YEARLY', namn: 'Årsabonnemang', enhet: '/år' },
} as const;

/**
 * Läsbar text för en historikpost. Nya poster sparas som "YEARLY_EMPLOYER",
 * gamla från tidigare prismodeller som "CV", "CV_ADS" eller "MONTHLY_*".
 */
export function historikPlanText(plan: string) {
  const gamla: Record<string, string> = {
    CV: 'CV-prenumeration (tidigare prislista)',
    CV_ADS: 'CV + Annonspaket (tidigare prislista)',
  };
  if (gamla[plan]) return gamla[plan];

  const [period, typ] = plan.split('_');
  const periodText =
    period === 'MONTHLY' ? 'månadsabonnemang (tidigare prislista)' : 'årsabonnemang';
  return typ ? `${periodText} (${bolagstypText(typ).toLowerCase()})` : periodText;
}

export function planNamnFor(subscription: string, companyType: string) {
  if (subscription === 'NONE') return 'Ingen prenumeration';
  const period =
    subscription === 'MONTHLY' ? 'Månadsabonnemang (tidigare prislista)' : 'Årsabonnemang';
  return `${period} – ${bolagstypText(companyType)}`;
}

/** Hur många kandidater ett företag utan abonnemang får se som smakprov. */
export const FORHANDSVISNING_ANTAL = 3;

export const FAKTURASATT = {
  EMAIL: {
    id: 'EMAIL',
    namn: 'PDF-faktura via e-post',
    beskrivning: 'Fakturan skickas som PDF till en e-postadress ni väljer.',
  },
  PAPER: {
    id: 'PAPER',
    namn: 'Pappersfaktura',
    beskrivning: 'Fakturan skickas med post till er fakturaadress.',
  },
} as const;

export function fakturasattText(id: string | null) {
  if (!id) return 'Ej valt';
  return (FAKTURASATT as Record<string, { namn: string }>)[id]?.namn ?? id;
}

/** Pris inklusive moms, avrundat till hela kronor. */
export function prisInklMoms(pris: number) {
  return Math.round(pris * (1 + MOMSSATS));
}

/** Ett företag måste vara godkänt av admin innan det får se något CV. */
export function arGodkant(company: { status: string }) {
  return company.status === 'APPROVED';
}

/**
 * Har företaget en giltig prenumeration just nu?
 *
 * Ett uppsagt årsabonnemang gäller perioden ut – de har betalat för året och
 * ska inte låsas ute i förtid.
 */
export function harGiltigPrenumeration(company: {
  subscription: string;
  subscriptionEndsAt: Date | null;
}) {
  if (company.subscription === 'NONE') return false;
  if (company.subscriptionEndsAt && company.subscriptionEndsAt < new Date()) return false;
  return true;
}

export function statusText(status: string) {
  return status === 'APPROVED'
    ? 'Godkänt'
    : status === 'REJECTED'
      ? 'Avslaget'
      : 'Väntar på granskning';
}

type AtkomstKontroll = {
  subscription: string;
  status: string;
  subscriptionEndsAt: Date | null;
};

/** Alla betalande företag får både CVArkivet och annonser. */
export function harCvAtkomst(company: AtkomstKontroll) {
  return arGodkant(company) && harGiltigPrenumeration(company);
}

export function harAnnonsAtkomst(company: AtkomstKontroll) {
  return arGodkant(company) && harGiltigPrenumeration(company);
}
