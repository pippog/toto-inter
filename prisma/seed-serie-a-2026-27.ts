import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseItalianLocalDateTime } from "../src/lib/italianTime";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEADLINE_MINUTES_BEFORE_KICKOFF = 5;

// Calendario Serie A 2026-27 dell'Inter (fonte: inter.it, incrociato con
// calciomagazine.net e stampa). Orari ufficiali solo per le giornate 1-5;
// dalla 6 in poi solo la data/weekend era nota alla stesura di questo script
// (2026-07-15) — orario segnaposto domenica 18:00 / mercoledì 21:00 per gli
// infrasettimanali noti, corretto automaticamente dalla discovery quando la
// Lega assegna gli orari definitivi (vedi tolleranza di adozione in
// src/app/api/cron/discover-fixtures/route.ts).
const FIXTURES: { opponent: string; isHome: boolean; kickoff: string }[] = [
  { opponent: "Monza", isHome: true, kickoff: "2026-08-22T18:30" },
  { opponent: "Cagliari", isHome: false, kickoff: "2026-08-30T20:45" },
  { opponent: "Napoli", isHome: true, kickoff: "2026-09-05T18:00" },
  { opponent: "Udinese", isHome: true, kickoff: "2026-09-14T20:45" },
  { opponent: "Roma", isHome: false, kickoff: "2026-09-19T18:00" },
  { opponent: "Parma", isHome: true, kickoff: "2026-10-11T18:00" },
  { opponent: "Bologna", isHome: false, kickoff: "2026-10-18T18:00" },
  { opponent: "Fiorentina", isHome: true, kickoff: "2026-10-25T18:00" },
  { opponent: "Venezia", isHome: false, kickoff: "2026-10-28T21:00" },
  { opponent: "Milan", isHome: false, kickoff: "2026-11-01T18:00" },
  { opponent: "Como", isHome: true, kickoff: "2026-11-08T18:00" },
  { opponent: "Atalanta", isHome: false, kickoff: "2026-11-22T18:00" },
  { opponent: "Genoa", isHome: true, kickoff: "2026-11-29T18:00" },
  { opponent: "Frosinone", isHome: false, kickoff: "2026-12-06T18:00" },
  { opponent: "Torino", isHome: true, kickoff: "2026-12-13T18:00" },
  { opponent: "Lecce", isHome: false, kickoff: "2026-12-20T18:00" },
  { opponent: "Sassuolo", isHome: true, kickoff: "2027-01-03T18:00" },
  { opponent: "Lazio", isHome: false, kickoff: "2027-01-06T21:00" },
  { opponent: "Juventus", isHome: true, kickoff: "2027-01-10T18:00" },
  { opponent: "Parma", isHome: false, kickoff: "2027-01-17T18:00" },
  { opponent: "Venezia", isHome: true, kickoff: "2027-01-24T18:00" },
  { opponent: "Napoli", isHome: false, kickoff: "2027-01-31T18:00" },
  { opponent: "Cagliari", isHome: true, kickoff: "2027-02-07T18:00" },
  { opponent: "Milan", isHome: true, kickoff: "2027-02-14T18:00" },
  { opponent: "Fiorentina", isHome: false, kickoff: "2027-02-21T18:00" },
  { opponent: "Atalanta", isHome: true, kickoff: "2027-02-28T18:00" },
  { opponent: "Udinese", isHome: false, kickoff: "2027-03-07T18:00" },
  { opponent: "Torino", isHome: false, kickoff: "2027-03-14T18:00" },
  { opponent: "Frosinone", isHome: true, kickoff: "2027-03-21T18:00" },
  { opponent: "Genoa", isHome: false, kickoff: "2027-04-04T18:00" },
  { opponent: "Roma", isHome: true, kickoff: "2027-04-11T18:00" },
  { opponent: "Monza", isHome: false, kickoff: "2027-04-18T18:00" },
  { opponent: "Bologna", isHome: true, kickoff: "2027-04-25T18:00" },
  { opponent: "Como", isHome: false, kickoff: "2027-05-02T18:00" },
  { opponent: "Lecce", isHome: true, kickoff: "2027-05-09T18:00" },
  { opponent: "Juventus", isHome: false, kickoff: "2027-05-16T18:00" },
  { opponent: "Lazio", isHome: true, kickoff: "2027-05-23T18:00" },
  { opponent: "Sassuolo", isHome: false, kickoff: "2027-05-30T18:00" },
];

async function main() {
  const season = await prisma.season.findFirstOrThrow({ where: { isActive: true } });

  let created = 0;
  let skipped = 0;

  for (const fx of FIXTURES) {
    const existing = await prisma.match.findFirst({
      where: {
        seasonId: season.id,
        competition: "SERIE_A",
        opponent: { equals: fx.opponent, mode: "insensitive" },
        isHome: fx.isHome,
      },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const kickoffAt = parseItalianLocalDateTime(fx.kickoff);
    const predictionDeadlineAt = new Date(
      kickoffAt.getTime() - DEADLINE_MINUTES_BEFORE_KICKOFF * 60_000,
    );

    await prisma.match.create({
      data: {
        seasonId: season.id,
        competition: "SERIE_A",
        opponent: fx.opponent,
        isHome: fx.isHome,
        kickoffAt,
        predictionDeadlineAt,
      },
    });
    created++;
  }

  console.log(`Stagione ${season.label}: ${created} partite create, ${skipped} già presenti (saltate).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
