import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const KATEGORIER = [
  'Lager & logistik',
  'Data & IT',
  'Ekonomi & redovisning',
  'Hälso- & sjukvård',
  'Försäljning & detaljhandel',
  'Bygg & anläggning',
];

async function main() {
  console.log('Seedar testdata…');

  const pw = await bcrypt.hash('losenord123', 10);

  // ---------------------------------------------------------------- Admin
  await prisma.admin.upsert({
    where: { email: 'admin@cvarkivet.se' },
    update: {},
    create: {
      email: 'admin@cvarkivet.se',
      name: 'Systemadministratör',
      passwordHash: pw,
    },
  });

  // -------------------------------------------------------------- Företag
  const foretag = [
    {
      orgNumber: '556677-8899',
      name: 'Nordisk Logistik AB',
      email: 'rekrytering@nordisklogistik.se',
      contactName: 'Anna Lind',
      phone: '070-111 22 33',
      address: 'Hamngatan 12, 211 22 Malmö',
      municipality: 'Malmö',
      subscription: 'CV_ADS',
      status: 'APPROVED',
      presentation:
        'Nordisk Logistik AB är en av Sydsveriges ledande tredjepartslogistiker med 240 anställda. Vi kör dygnet runt och satsar hårt på intern utveckling.',
    },
    {
      orgNumber: '559900-1122',
      name: 'Byggpartner Väst AB',
      email: 'jobb@byggpartnervast.se',
      contactName: 'Erik Sandström',
      phone: '070-222 33 44',
      address: 'Verkstadsgatan 5, 417 07 Göteborg',
      municipality: 'Göteborg',
      subscription: 'CV',
      status: 'APPROVED',
      presentation:
        'Vi bygger bostäder i västra Sverige. Trygga anställningar, kollektivavtal och bra kompisgäng.',
    },
    {
      orgNumber: '556123-4567',
      name: 'AB Teknikkonsult',
      email: 'hr@ab.se',
      contactName: 'Maria Berg',
      phone: '070-333 44 55',
      address: 'Kungsgatan 40, 111 35 Stockholm',
      municipality: 'Stockholm',
      subscription: 'NONE',
      status: 'PENDING', // ligger i granskningskön så att adminvyn går att testa
      presentation: 'Teknikkonsulter inom automation och industriell IT.',
    },
  ];

  const skapadeForetag = [];
  for (const f of foretag) {
    const c = await prisma.company.upsert({
      where: { email: f.email },
      update: {
        status: f.status,
        subscription: f.subscription,
        reviewedAt: f.status === 'APPROVED' ? new Date() : null,
      },
      create: {
        ...f,
        passwordHash: pw,
        subscriptionStarted: f.subscription === 'NONE' ? null : new Date(),
        reviewedAt: f.status === 'APPROVED' ? new Date() : null,
      },
    });
    skapadeForetag.push(c);
    if (f.subscription !== 'NONE') {
      const finns = await prisma.subscriptionEvent.findFirst({ where: { companyId: c.id } });
      if (!finns)
        await prisma.subscriptionEvent.create({
          data: { companyId: c.id, type: 'ACTIVATED', plan: f.subscription },
        });
    }
  }

  // ------------------------------------------------------------ Kandidater
  const kandidater = [
    {
      firstName: 'Johan',
      lastName: 'Persson',
      email: 'johan@example.se',
      phone: '070-555 11 22',
      birthDate: '19900115',
      homeMunicipality: 'Malmö',
      headline: 'Lagerarbetare med truckkort A–B',
      salaryExpectation: 31000,
      activelyLooking: true,
      kategorier: ['Lager & logistik'],
      kommuner: ['Malmö', 'Lund', 'Burlöv'],
    },
    {
      firstName: 'Sara',
      lastName: 'Nilsson',
      email: 'sara@example.se',
      phone: '070-555 33 44',
      birthDate: '19850620',
      homeMunicipality: 'Göteborg',
      headline: 'Systemutvecklare .NET',
      salaryExpectation: 58000,
      activelyLooking: true,
      kategorier: ['Data & IT'],
      kommuner: ['Distans', 'Göteborg', 'Mölndal'],
    },
    {
      firstName: 'Ali',
      lastName: 'Hassan',
      email: 'ali@example.se',
      phone: '070-555 55 66',
      birthDate: '19980304',
      homeMunicipality: 'Stockholm',
      headline: 'Redovisningsekonom',
      salaryExpectation: null,
      activelyLooking: false,
      kategorier: ['Ekonomi & redovisning'],
      kommuner: ['Stockholm', 'Solna', 'Distans'],
    },
    {
      firstName: 'Emma',
      lastName: 'Karlsson',
      email: 'emma@example.se',
      phone: '070-555 77 88',
      birthDate: '19931122',
      homeMunicipality: 'Lund',
      headline: 'Undersköterska, 6 års erfarenhet',
      salaryExpectation: 33500,
      activelyLooking: true,
      kategorier: ['Hälso- & sjukvård'],
      kommuner: ['Lund', 'Malmö', 'Staffanstorp'],
    },
  ];

  for (const k of kandidater) {
    const { kategorier, kommuner, ...rest } = k;
    const u = await prisma.user.upsert({
      where: { email: k.email },
      update: {},
      create: {
        ...rest,
        passwordHash: pw,
        summary: `${k.headline}. Söker nya utmaningar och trivs bäst i team.`,
        coverLetter:
          'Hej! Jag är en engagerad och pålitlig person som gillar att ta ansvar. Jag lär mig snabbt och trivs i högt tempo.',
        skills: 'Samarbete, ansvarstagande, problemlösning',
        languages: 'Svenska, engelska',
        drivingLicense: 'B',
        cvUpdatedAt: new Date(),
      },
    });

    for (const c of kategorier)
      await prisma.userCategory.upsert({
        where: { userId_category: { userId: u.id, category: c } },
        update: {},
        create: { userId: u.id, category: c },
      });

    for (const m of kommuner)
      await prisma.userMunicipality.upsert({
        where: { userId_municipality: { userId: u.id, municipality: m } },
        update: {},
        create: { userId: u.id, municipality: m },
      });

    const harErfarenhet = await prisma.experience.findFirst({ where: { userId: u.id } });
    if (!harErfarenhet) {
      await prisma.experience.create({
        data: {
          userId: u.id,
          title: k.headline.split(',')[0],
          employer: 'Tidigare Arbetsgivare AB',
          location: k.homeMunicipality,
          fromDate: '2019-08',
          toDate: null,
          description: 'Ansvarade för dagligt operativt arbete och upplärning av nyanställda.',
        },
      });
      await prisma.education.create({
        data: {
          userId: u.id,
          program: 'Gymnasieutbildning',
          school: `${k.homeMunicipality}s gymnasium`,
          fromDate: '2006-08',
          toDate: '2009-06',
        },
      });
    }
  }

  // ------------------------------------------------------- Exempel-annonser
  const logistik = skapadeForetag[0];
  const finnsAnnons = await prisma.jobAd.findFirst({ where: { companyId: logistik.id } });
  if (!finnsAnnons) {
    const om30 = new Date();
    om30.setDate(om30.getDate() + 30);
    await prisma.jobAd.createMany({
      data: [
        {
          companyId: logistik.id,
          title: 'Lagermedarbetare till nattskift',
          body: 'Vi söker dig som vill jobba natt i vårt centrallager i Malmö. Truckkort är meriterande men inget krav – vi utbildar internt.',
          applyEmail: 'rekrytering@nordisklogistik.se',
          deadline: om30,
          municipality: 'Malmö',
          category: 'Lager & logistik',
          salaryMin: 29000,
          salaryMax: 34000,
        },
        {
          companyId: logistik.id,
          title: 'Transportplanerare',
          body: 'Du planerar och optimerar våra rutter i Skåne. Vi ser gärna att du har erfarenhet av TMS-system.',
          applyUrl: 'https://nordisklogistik.se/jobb',
          deadline: om30,
          municipality: 'Malmö',
          category: 'Transport & fordon',
          salaryMin: 36000,
          salaryMax: 42000,
        },
      ],
    });
  }

  // Kandidat döljer sig för domänen ab.se (som AB Teknikkonsult använder)
  const johan = await prisma.user.findUnique({ where: { email: 'johan@example.se' } });
  if (johan)
    await prisma.hiddenDomain.upsert({
      where: { userId_domain: { userId: johan.id, domain: 'ab.se' } },
      update: {},
      create: { userId: johan.id, domain: 'ab.se' },
    });

  console.log(`
Klart! Testinloggningar (lösenord för alla: losenord123)

  Admin:      admin@cvarkivet.se
  Företag:    rekrytering@nordisklogistik.se   (godkänt, CV + Annonspaket)
              jobb@byggpartnervast.se          (godkänt, CV-prenumeration)
              hr@ab.se                         (VÄNTAR PÅ GRANSKNING – testa admin här)
  Kandidater: johan@example.se, sara@example.se, ali@example.se, emma@example.se
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
