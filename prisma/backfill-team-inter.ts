import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// One-off: crea la riga Team per l'Inter e assegna il suo id a ogni
// Match/Player esistente ancora senza teamId. Idempotente (upsert +
// updateMany su teamId:null): safe da rilanciare. Va eseguito DOPO la
// migrazione che aggiunge teamId nullable e PRIMA di quella che lo rende
// NOT NULL.
const INTER_EXTERNAL_REF = "430539"; // src/lib/football-provider/highlightlyProvider.ts INTER_TEAM_ID — non importare quel file da qui, ha "import server-only" in cima e crasha fuori da Next.js

async function main() {
  const team = await prisma.team.upsert({
    where: { externalRef: INTER_EXTERNAL_REF },
    update: {},
    create: { externalRef: INTER_EXTERNAL_REF, name: "Inter" },
  });

  // Nessun filtro su teamId: ad oggi esiste una sola squadra (Inter), quindi
  // ogni Match/Player esistente le appartiene — impostare teamId senza
  // condizione è idempotente (riscrivere lo stesso valore è un no-op) e
  // evita di filtrare su un campo che nello schema finale (dopo la
  // migrazione successiva) non è più nullable.
  const matches = await prisma.match.updateMany({
    data: { teamId: team.id },
  });
  const players = await prisma.player.updateMany({
    data: { teamId: team.id },
  });

  console.log(`Team Inter: ${team.id}`);
  console.log(`Match aggiornati: ${matches.count}`);
  console.log(`Player aggiornati: ${players.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
