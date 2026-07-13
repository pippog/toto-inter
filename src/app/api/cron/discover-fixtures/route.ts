import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { getActiveSeason } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { apiFootballProvider, INTER_TEAM_ID } from "@/lib/football-provider/apiFootballProvider";

// Il piano Free di API-Football accetta `date=` solo entro una finestra
// mobile di pochi giorni attorno a oggi (verificato in produzione): oltre
// non serve comunque spingersi, dato che i giorni fuori finestra vengono
// scartati (findUpcomingFixtures li salta senza fallire).
const DISCOVERY_WINDOW_DAYS = 3;
const PREDICTION_DEADLINE_MINUTES_BEFORE_KICKOFF = 5;

// Scopre le prossime partite dell'Inter e crea le righe Match da confermare
// (mai risultati, solo calendario — vedi piano). Idempotente: identifica le
// partite già note tramite external_ref (unique), aggiornando kickoff_at
// solo se l'orario è cambiato (partita rinviata/recuperata).
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const season = await getActiveSeason();
  const fixtures = await apiFootballProvider.findUpcomingFixtures(
    INTER_TEAM_ID,
    DISCOVERY_WINDOW_DAYS,
  );

  let created = 0;
  let updated = 0;

  for (const fx of fixtures) {
    const deadline = new Date(
      fx.kickoffAt.getTime() - PREDICTION_DEADLINE_MINUTES_BEFORE_KICKOFF * 60_000,
    );

    const existing = await prisma.match.findUnique({ where: { externalRef: fx.externalRef } });

    if (existing) {
      if (existing.kickoffAt.getTime() !== fx.kickoffAt.getTime()) {
        await prisma.match.update({
          where: { id: existing.id },
          data: { kickoffAt: fx.kickoffAt, predictionDeadlineAt: deadline },
        });
        updated++;
      }
      continue;
    }

    await prisma.match.create({
      data: {
        seasonId: season.id,
        competition: fx.competition,
        opponent: fx.opponent,
        isHome: fx.isHome,
        kickoffAt: fx.kickoffAt,
        predictionDeadlineAt: deadline,
        externalRef: fx.externalRef,
      },
    });
    created++;
  }

  return NextResponse.json({ found: fixtures.length, created, updated });
}
