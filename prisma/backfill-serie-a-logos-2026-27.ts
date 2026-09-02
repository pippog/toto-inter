import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Loghi (stemmi da Wikipedia, stesso formato già in uso per Cagliari) degli
// avversari di Serie A 2026-27 ancora senza opponentLogoUrl — vedi
// seed-serie-a-2026-27.ts per il calendario. Applica solo dove il campo è
// ancora nullo: un logo inserito a mano da un admin non va sovrascritto.
const LOGOS: Record<string, string> = {
  Monza:
    "https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/AC_Monza_logo_%282021%29.svg/330px-AC_Monza_logo_%282021%29.svg.png",
  Napoli:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/SSC_Napoli_2025_%28white_and_azure%29.svg/330px-SSC_Napoli_2025_%28white_and_azure%29.svg.png",
  Udinese:
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/ce/Udinese_Calcio_logo.svg/330px-Udinese_Calcio_logo.svg.png",
  Roma: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f7/AS_Roma_logo_%282017%29.svg/330px-AS_Roma_logo_%282017%29.svg.png",
  Parma:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Logo_Parma_Calcio_1913_%28adozione_2016%29.svg/330px-Logo_Parma_Calcio_1913_%28adozione_2016%29.svg.png",
  Bologna:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Bologna_F.C._1909_logo.svg/330px-Bologna_F.C._1909_logo.svg.png",
  Fiorentina:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/ACF_Fiorentina_-_logo_%28Italy%2C_2022%29.svg/330px-ACF_Fiorentina_-_logo_%28Italy%2C_2022%29.svg.png",
  Venezia:
    "https://upload.wikimedia.org/wikipedia/en/thumb/3/39/Venezia_FC_crest.svg/330px-Venezia_FC_crest.svg.png",
  Milan:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_of_AC_Milan.svg/330px-Logo_of_AC_Milan.svg.png",
  Como: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Calcio_Como_-_logo_%28Italy%2C_2019-%29.svg/330px-Calcio_Como_-_logo_%28Italy%2C_2019-%29.svg.png",
  Atalanta:
    "https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Atalanta_BC_new_logo.svg/330px-Atalanta_BC_new_logo.svg.png",
  Genoa:
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/2c/Genoa_CFC_crest.svg/330px-Genoa_CFC_crest.svg.png",
  Frosinone:
    "https://upload.wikimedia.org/wikipedia/en/thumb/0/0b/Frosinone_Calcio_logo.svg/330px-Frosinone_Calcio_logo.svg.png",
  Torino:
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Torino_FC_Logo.svg/330px-Torino_FC_Logo.svg.png",
  Lecce:
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/23/US_Lecce_crest.svg/330px-US_Lecce_crest.svg.png",
  Sassuolo:
    "https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/US_Sassuolo_Calcio_logo.svg/330px-US_Sassuolo_Calcio_logo.svg.png",
  Lazio:
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/ce/S.S._Lazio_badge.svg/330px-S.S._Lazio_badge.svg.png",
  Juventus:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg/330px-Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg.png",
};

async function main() {
  const season = await prisma.season.findFirstOrThrow({ where: { isActive: true } });

  let updated = 0;

  for (const [opponent, opponentLogoUrl] of Object.entries(LOGOS)) {
    const { count } = await prisma.match.updateMany({
      where: {
        seasonId: season.id,
        competition: "SERIE_A",
        opponent: { equals: opponent, mode: "insensitive" },
        opponentLogoUrl: null,
      },
      data: { opponentLogoUrl },
    });
    updated += count;
  }

  console.log(`Stagione ${season.label}: ${updated} partite aggiornate con il logo avversario.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
