import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { applyMatchResult } from "./applyMatchResult";

// Test di integrazione contro il DB reale (Neon di sviluppo): verifica che
// una correzione su una partita passata rigiochi correttamente lo streak
// delle partite successive nella stessa stagione (recomputeSeasonFrom),
// non solo la singola partita corretta. Crea ed elimina i propri dati.
describe("applyMatchResult — ricalcolo a cascata su correzione", () => {
  let seasonId: string;
  let userId: string;
  let matchIds: string[] = [];

  beforeAll(async () => {
    const season = await prisma.season.create({
      data: { label: `TEST-CASCADE-${Date.now()}`, isActive: false },
    });
    seasonId = season.id;

    const user = await prisma.user.create({
      data: {
        name: "Streak Test User",
        email: `streaktest-${Date.now()}@toto-inter.local`,
        status: "ACTIVE",
        role: "PLAYER",
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.matchScore.deleteMany({ where: { matchId: { in: matchIds } } });
    await prisma.prediction.deleteMany({ where: { matchId: { in: matchIds } } });
    await prisma.match.deleteMany({ where: { id: { in: matchIds } } });
    await prisma.playerStreakState.deleteMany({ where: { seasonId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.season.delete({ where: { id: seasonId } });
  });

  it("streak cresce 1→2→3 su 3 vittorie consecutive, poi si ricalcola a cascata dopo una correzione", async () => {
    const base = new Date("2026-08-01T18:00:00Z");
    const kickoffs = [0, 1, 2].map(
      (i) => new Date(base.getTime() + i * 60 * 60 * 1000),
    );

    const matches = await Promise.all(
      kickoffs.map((kickoffAt) =>
        prisma.match.create({
          data: {
            seasonId,
            competition: "SERIE_A",
            opponent: "Avversario Test",
            isHome: true,
            kickoffAt,
            predictionDeadlineAt: new Date(kickoffAt.getTime() - 5 * 60_000),
          },
        }),
      ),
    );
    matchIds = matches.map((m) => m.id);

    for (const match of matches) {
      await prisma.prediction.create({
        data: {
          matchId: match.id,
          userId,
          predictedHomeScore: 1,
          predictedAwayScore: 0,
          predictedScorerKind: "NONE",
        },
      });
    }

    // Applica in ordine 3 risultati 1-0 identici alla previsione -> 3 vittorie di fila sul risultato.
    for (const match of matches) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          homeScore: 1,
          awayScore: 0,
          firstScorerKind: "NONE",
          resultSource: "MANUAL",
        },
      });
      await applyMatchResult(match.id);
    }

    const scoreBeforeCorrection = await prisma.matchScore.findUniqueOrThrow({
      where: { matchId_userId: { matchId: matches[2].id, userId } },
    });
    expect(scoreBeforeCorrection.resStreakLenAfter).toBe(3);
    expect(Number(scoreBeforeCorrection.resStreakBonusPct)).toBeCloseTo(0.6);

    // Correzione: la partita 1 in realtà è finita 2-2 -> il pronostico
    // dell'utente (1-0) diventa sbagliato, lo streak su quella partita si
    // azzera e l'effetto deve propagarsi alle partite 2 e 3.
    await prisma.match.update({
      where: { id: matches[0].id },
      data: { homeScore: 2, awayScore: 2 },
    });
    await applyMatchResult(matches[0].id);

    const [m1, m2, m3] = await Promise.all(
      matches.map((m) =>
        prisma.matchScore.findUniqueOrThrow({
          where: { matchId_userId: { matchId: m.id, userId } },
        }),
      ),
    );

    expect(m1.resCorrect).toBe(false);
    expect(m1.resStreakLenAfter).toBe(0);

    expect(m2.resCorrect).toBe(true);
    expect(m2.resStreakLenAfter).toBe(1);
    expect(Number(m2.resStreakBonusPct)).toBe(0);

    expect(m3.resCorrect).toBe(true);
    expect(m3.resStreakLenAfter).toBe(2);
    expect(Number(m3.resStreakBonusPct)).toBeCloseTo(0.3);
  }, 30_000);
});
