import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// One-off: assegna alla lega "storica" ogni MatchScore/PlayerStreakState
// esistente, creato prima che queste tabelle guadagnassero leagueId (Step 3).
// Va eseguito DOPO la migrazione che aggiunge leagueId nullable e PRIMA di
// quelle che lo rendono NOT NULL/parte della chiave. Nessun filtro su
// leagueId: ad oggi esiste una sola lega, quindi ogni riga le appartiene —
// impostarlo senza condizione è idempotente e evita di filtrare su un campo
// che nello schema finale non è più nullable (stessa tecnica di
// backfill-team-inter.ts).
async function main() {
  const league = await prisma.league.findUniqueOrThrow({
    where: { slug: "storica" },
  });

  const { count: scoresCount } = await prisma.matchScore.updateMany({
    data: { leagueId: league.id },
  });
  const { count: streaksCount } = await prisma.playerStreakState.updateMany({
    data: { leagueId: league.id },
  });

  console.log(`Lega storica: ${league.id}`);
  console.log(`MatchScore backfillati: ${scoresCount}`);
  console.log(`PlayerStreakState backfillati: ${streaksCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
