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

export const PLANER = {
  NONE: {
    id: 'NONE',
    namn: 'Ingen prenumeration',
    pris: 0,
    beskrivning: 'Kontot är skapat men tjänsten är inte aktiverad.',
  },
  CV: {
    id: 'CV',
    namn: 'CV-prenumeration',
    pris: 299,
    beskrivning: 'Bläddra bland alla registrerade CV under fliken CVArkivet.',
  },
  CV_ADS: {
    id: 'CV_ADS',
    namn: 'CV + Annonspaket',
    pris: 499,
    beskrivning: 'Allt i CV-prenumerationen samt möjlighet att publicera egna annonser.',
  },
} as const;

export type PlanId = keyof typeof PLANER;

/** Pris inklusive moms, avrundat till hela kronor. */
export function prisInklMoms(pris: number) {
  return Math.round(pris * (1 + MOMSSATS));
}

export function planNamn(id: string) {
  return (PLANER as Record<string, { namn: string }>)[id]?.namn ?? id;
}

/** Ett företag måste vara godkänt av admin innan det får se något CV. */
export function arGodkant(company: { status: string }) {
  return company.status === 'APPROVED';
}

export function statusText(status: string) {
  return status === 'APPROVED'
    ? 'Godkänt'
    : status === 'REJECTED'
      ? 'Avslaget'
      : 'Väntar på granskning';
}

export function harCvAtkomst(company: { subscription: string; status: string }) {
  if (!arGodkant(company)) return false;
  return company.subscription === 'CV' || company.subscription === 'CV_ADS';
}

export function harAnnonsAtkomst(company: { subscription: string; status: string }) {
  if (!arGodkant(company)) return false;
  return company.subscription === 'CV_ADS';
}
