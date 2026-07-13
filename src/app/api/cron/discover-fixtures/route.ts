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

// Tolleranza per "adottare" una partita creata a mano invece di duplicarla
// (vedi sotto): abbastanza larga da assorbire un'imprecisione nell'orario
// inserito a mano, ma l'Inter non gioca mai due volte contro lo stesso
// avversario a poche ore di distanza nella stessa stagione, quindi non
// rischia di agganciare la partita sbagliata.
const MANUAL_MATCH_ADOPTION_TOLERANCE_MS = 12 * 60 * 60 * 1000;

// Scopre le prossime partite dell'Inter e crea le righe Match da confermare
// (mai risultati, solo calendario — vedi piano). Idempotente: identifica le
// partite già note tramite external_ref (unique), aggiornando kickoff_at
// solo se l'orario è cambiato (partita rinviata/recuperata). Se una partita
// è già stata creata a mano (senza external_ref) prima che la scoperta
// automatica la raggiungesse, la adotta (le assegna l'external_ref) invece
// di crearne una seconda identica.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const squadSync = await syncSquad();

  const season = await getActiveSeason();
  const fixtures = await apiFootballProvider.findUpcomingFixtures(
    INTER_TEAM_ID,
    DISCOVERY_WINDOW_DAYS,
  );

  let created = 0;
  let updated = 0;
  let adopted = 0;

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

    const manualMatches = await prisma.match.findMany({
      where: {
        seasonId: season.id,
        externalRef: null,
        opponent: { equals: fx.opponent, mode: "insensitive" },
      },
    });
    const adoptable = manualMatches.find(
      (m) =>
        Math.abs(m.kickoffAt.getTime() - fx.kickoffAt.getTime()) <=
        MANUAL_MATCH_ADOPTION_TOLERANCE_MS,
    );

    if (adoptable) {
      await prisma.match.update({
        where: { id: adoptable.id },
        data: {
          externalRef: fx.externalRef,
          competition: fx.competition,
          isHome: fx.isHome,
          kickoffAt: fx.kickoffAt,
          predictionDeadlineAt: deadline,
        },
      });
      adopted++;
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

  return NextResponse.json({ found: fixtures.length, created, updated, adopted, squadSync });
}

// Rosa per la tendina marcatore (vedi Player nello schema): sincronizzata
// qui, una volta al giorno insieme alla scoperta partite, non ad ogni
// caricamento del form — la rosa cambia solo nelle finestre di mercato.
async function syncSquad() {
  const squad = await apiFootballProvider.getSquad(INTER_TEAM_ID);
  if (squad.length === 0) {
    return { synced: 0, deactivated: 0 };
  }

  for (const p of squad) {
    await prisma.player.upsert({
      where: { externalRef: p.externalRef },
      update: { name: p.name, active: true },
      create: { externalRef: p.externalRef, name: p.name, active: true },
    });
  }

  const { count } = await prisma.player.updateMany({
    where: { externalRef: { notIn: squad.map((p) => p.externalRef) } },
    data: { active: false },
  });

  return { synced: squad.length, deactivated: count };
}
