import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Dataportabilitet enligt artikel 20 i GDPR.
 *
 * Kandidaten laddar ner allt vi har om hen som JSON – ett strukturerat och
 * maskinläsbart format, vilket är vad förordningen kräver. Filen innehåller
 * också uppgifter som kandidaten annars inte ser samlat: vilka företag som
 * läst CV:t, vilka som laddat ner det, och vilka företag som hjärtat hen.
 *
 * Uppgifter om *andra* personer följer inte med. Meddelanden tas med eftersom
 * de är riktade till kandidaten själv, men bara företagets namn – inte något
 * om företagets kontaktperson utöver det som redan visas i gränssnittet.
 */
export async function GET() {
  const session = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      categories: { select: { category: true } },
      municipalities: { select: { municipality: true } },
      experiences: { orderBy: { fromDate: 'desc' } },
      educations: { orderBy: { fromDate: 'desc' } },
      hiddenCompanies: { include: { company: { select: { name: true } } } },
      hiddenDomains: { select: { domain: true } },
      favorites: { include: { company: { select: { name: true } } } },
    },
  });

  if (!user) return new Response('Kontot hittades inte.', { status: 404 });

  const [visningar, nedladdningar, hjartan, intressen, meddelanden, granskning, besok] =
    await Promise.all([
      prisma.cvView.findMany({
        where: { userId: user.id },
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cvDownload.findMany({
        where: { userId: user.id },
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.heart.findMany({
        where: { userId: user.id },
        include: { company: { select: { name: true } } },
      }),
      prisma.interest.findMany({
        where: { userId: user.id },
        include: { jobAd: { select: { title: true, company: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.findMany({
        where: { userId: user.id },
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.cvReview.findUnique({ where: { userId: user.id } }),
      prisma.companyVisit.findMany({
        where: { userId: user.id },
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

  const data = {
    omExporten: {
      beskrivning:
        'Alla personuppgifter CVArkivet.se har om dig, enligt artikel 20 i GDPR (dataportabilitet).',
      uttagetTidpunkt: new Date().toISOString(),
      kontaktVidFragor: 'support@cvarkivet.se',
    },

    kontouppgifter: {
      fornamn: user.firstName,
      efternamn: user.lastName,
      epost: user.email,
      telefon: user.phone,
      fodelsedatum: user.birthDate,
      hemmahorandeKommun: user.homeMunicipality,
      profilbild: user.photoUrl,
      kontoSkapat: user.createdAt,
      senasteInloggning: user.lastLoginAt,
      kontoAvstangt: user.suspended,
      noteringOmFodelsedatum:
        'Vi lagrar aldrig fullständigt personnummer. Företag ser bara din ålder.',
    },

    cv: {
      yrkesrubrik: user.headline,
      soker: user.seeking,
      presentation: user.summary,
      personligtBrev: user.coverLetter,
      kompetenser: user.skills,
      sprak: user.languages,
      korkort: user.drivingLicense,
      loneanssprak: user.salaryExpectation,
      sokerAktivt: user.activelyLooking,
      senastUppdaterat: user.cvUpdatedAt,
      yrkeskategorier: user.categories.map((c) => c.category),
      onskadeKommuner: user.municipalities.map((m) => m.municipality),
      arbetslivserfarenhet: user.experiences.map((e) => ({
        titel: e.title,
        arbetsgivare: e.employer,
        ort: e.location,
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
    },

    dinaInstallningar: {
      notisNarForetagLaserCv: user.notifyOnCvView,
      doldForForetag: user.hiddenCompanies.map((h) => ({
        foretag: h.company.name,
        dolddSedan: h.createdAt,
      })),
      blockeradeEpostdomaner: user.hiddenDomains.map((d) => d.domain),
      dinaFavoritforetag: user.favorites.map((f) => ({
        foretag: f.company.name,
        sedan: f.createdAt,
      })),
    },

    aktivitet: {
      foretagSomLastDittCv: visningar.map((v) => ({
        foretag: v.company.name,
        tidpunkt: v.createdAt,
      })),
      foretagSomLaddatNerDittCv: nedladdningar.map((n) => ({
        foretag: n.company.name,
        tidpunkt: n.createdAt,
      })),
      foretagSomHjartatDig: hjartan.map((h) => ({
        foretag: h.company.name,
        tidpunkt: h.createdAt,
      })),
      foretagsprofilerDuBesokt: besok.map((b) => ({
        foretag: b.company.name,
        tidpunkt: b.createdAt,
      })),
      dinaIntresseanmalningar: intressen.map((i) => ({
        tjanst: i.jobAd.title,
        foretag: i.jobAd.company.name,
        dittMeddelande: i.message,
        tidpunkt: i.createdAt,
      })),
    },

    meddelanden: meddelanden.map((m) => ({
      motpart: m.company.name,
      avsandare: m.senderType === 'COMPANY' ? 'Företaget' : 'Du',
      text: m.body,
      tidpunkt: m.createdAt,
      lastAv: m.readAt,
    })),

    aiGranskningAvDittCv: granskning
      ? {
          helhetsomdome: granskning.summary,
          hurKomplett: granskning.completeness,
          forslag: JSON.parse(granskning.suggestions),
          granskad: granskning.createdAt,
        }
      : null,
  };

  const filnamn = `cvarkivet-mina-uppgifter-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${filnamn}"`,
      // Ska aldrig cachas – innehåller allt om en enskild person.
      'cache-control': 'no-store, max-age=0',
    },
  });
}
