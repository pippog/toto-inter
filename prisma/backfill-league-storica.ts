import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const INTER_EXTERNAL_REF = "430539";

// One-off: crea la lega "storica" per l'Inter e iscrive ogni User esistente
// (inclusi i DISABLED, con MatchScore storici da preservare). L'admin più
// anziano per createdAt diventa createdByUserId/OWNER; tutti gli altri
// MEMBER. Idempotente: upsert sulla lega, createMany+skipDuplicates sulle
// membership.
async function main() {
  const team = await prisma.team.findFirstOrThrow({
    where: { externalRef: INTER_EXTERNAL_REF },
  });

  const admin = await prisma.user.findFirstOrThrow({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });

  const league = await prisma.league.upsert({
    where: { slug: "storica" },
    update: {},
    create: {
      name: "Il Giochino - Storica",
      slug: "storica",
      teamId: team.id,
      createdByUserId: admin.id,
    },
  });

  const users = await prisma.user.findMany({ select: { id: true } });

  const { count } = await prisma.leagueMembership.createMany({
    data: users.map((u) => ({
      userId: u.id,
      leagueId: league.id,
      role: u.id === admin.id ? "OWNER" : "MEMBER",
    })),
    skipDuplicates: true,
  });

  console.log(`Lega storica: ${league.id} (team ${team.name})`);
  console.log(`Membership create: ${count} (su ${users.length} utenti totali)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
