import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const season = await prisma.season.upsert({
    where: { label: "2026-27" },
    update: {},
    create: { label: "2026-27", isActive: true },
  });

  const users = [
    {
      name: "Admin",
      email: "admin@toto-inter.local",
      password: "cambiami-admin",
      role: "ADMIN" as const,
    },
    {
      name: "Giocatore 1",
      email: "player1@toto-inter.local",
      password: "cambiami-player1",
      role: "PLAYER" as const,
    },
    {
      name: "Giocatore 2",
      email: "player2@toto-inter.local",
      password: "cambiami-player2",
      role: "PLAYER" as const,
    },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        status: "ACTIVE",
      },
    });
    console.log(`Seeded ${u.role} ${u.email} / password: ${u.password}`);
  }

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
