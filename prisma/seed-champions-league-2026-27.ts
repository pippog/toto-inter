import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseItalianLocalDateTime } from "../src/lib/italianTime";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEADLINE_MINUTES_BEFORE_KICKOFF = 5;

// Calendario Champions League 2026-27 (fase campionato) dell'Inter — 8
// giornate, fonte: sorteggio del 28/8/2026, incrociato su Sky Sport,
// Corriere dello Sport e Goal.com (stesura 2026-09-02). Orari UEFA
// standard 21:00 salvo diversa comunicazione.
const FIXTURES: {
  opponent: string;
  isHome: boolean;
  kickoff: string;
  opponentLogoUrl: string;
}[] = [
  {
    opponent: "Real Madrid",
    isHome: false,
    kickoff: "2026-09-08T21:00",
    opponentLogoUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/330px-Real_Madrid_CF.svg.png",
  },
  {
    opponent: "Club Brugge",
    isHome: true,
    kickoff: "2026-10-13T21:00",
    opponentLogoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Club_brugge.png/330px-Club_brugge.png",
  },
  {
    opponent: "Shakhtar Donetsk",
    isHome: true,
    kickoff: "2026-10-21T21:00",
    opponentLogoUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/a/a1/FC_Shakhtar_Donetsk.svg/330px-FC_Shakhtar_Donetsk.svg.png",
  },
  {
    opponent: "Feyenoord",
    isHome: false,
    kickoff: "2026-11-03T21:00",
    opponentLogoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Feyenoord_logo_since_2024.svg/330px-Feyenoord_logo_since_2024.svg.png",
  },
  {
    opponent: "Stuttgart",
    isHome: true,
    kickoff: "2026-11-25T21:00",
    opponentLogoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/VfB_Stuttgart_1893_Logo.svg/330px-VfB_Stuttgart_1893_Logo.svg.png",
  },
  {
    opponent: "Borussia Dortmund",
    isHome: false,
    kickoff: "2026-12-09T21:00",
    opponentLogoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/330px-Borussia_Dortmund_logo.svg.png",
  },
  {
    opponent: "Liverpool",
    isHome: true,
    kickoff: "2027-01-19T21:00",
    opponentLogoUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/330px-Liverpool_FC.svg.png",
  },
  {
    opponent: "Slovan Bratislava",
    isHome: false,
    kickoff: "2027-01-27T21:00",
    opponentLogoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/SK_Slovan_Bratislava_logo.svg/330px-SK_Slovan_Bratislava_logo.svg.png",
  },
];

async function main() {
  const season = await prisma.season.findFirstOrThrow({ where: { isActive: true } });

  let created = 0;
  let skipped = 0;

  for (const fx of FIXTURES) {
    const existing = await prisma.match.findFirst({
      where: {
        seasonId: season.id,
        competition: "CHAMPIONS_LEAGUE",
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
        competition: "CHAMPIONS_LEAGUE",
        opponent: fx.opponent,
        opponentLogoUrl: fx.opponentLogoUrl,
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
