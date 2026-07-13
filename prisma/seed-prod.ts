import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Seed di produzione: crea SOLO la stagione attiva e un unico admin, con una
// password generata a caso stampata una volta sola in console. Nessun
// giocatore di prova (a differenza di seed.ts, pensato per lo sviluppo
// locale) — gli altri utenti si aggiungono da /admin/users una volta
// loggati. Cambiare subito la password admin da /profile dopo il primo
// accesso.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const seasonLabel = process.env.SEED_SEASON_LABEL ?? "2026-27";
  const season = await prisma.season.upsert({
    where: { label: seasonLabel },
    update: {},
    create: { label: seasonLabel, isActive: true },
  });

  const adminName = process.env.SEED_ADMIN_NAME ?? "Admin";
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error(
      "SEED_ADMIN_EMAIL non impostata: passa l'email del primo admin, es. SEED_ADMIN_EMAIL=me@example.com npm run seed:prod",
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Admin ${adminEmail} esiste già, nessuna modifica.`);
    console.log(`Stagione attiva: ${season.label}`);
    return;
  }

  const password = randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`Admin creato: ${adminEmail} / password: ${password}`);
  console.log("Cambia questa password da /profile subito dopo il primo accesso.");
  console.log(`Stagione attiva: ${season.label}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
