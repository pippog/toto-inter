import "server-only";
import { prisma } from "@/lib/db";
import { computeMatchScores } from "./computeMatchScores";
import type { OfficialResult, PlayerPrediction, StreakState } from "./types";

// Punto unico di ingresso: sia per calcolare una partita appena conclusa sia
// per correggere un risultato passato, si passa sempre da qui, che a sua
// volta rigioca la stagione da quella partita in poi (recomputeSeasonFrom).
// Un'unica implementazione evita di dover mantenere sincronizzati un
// percorso "veloce" e uno "di correzione" (vedi piano).
export async function applyMatchResult(matchId: string) {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
  });
  await recomputeSeasonFrom(match.seasonId, match.kickoffAt);
}

export async function recomputeSeasonFrom(seasonId: string, fromKickoffAt: Date) {
  const roster = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });
  const allActivePlayerIds = roster.map((u) => u.id);

  // Streak di partenza = quelle risultanti dall'ultima partita già calcolata
  // prima di fromKickoffAt in questa stagione (0 se non ce n'è nessuna).
  const priorMatch = await prisma.match.findFirst({
    where: {
      seasonId,
      kickoffAt: { lt: fromKickoffAt },
      scoringComputedAt: { not: null },
    },
    orderBy: { kickoffAt: "desc" },
    include: { matchScores: true },
  });

  let runningStreaks = new Map<string, StreakState>();
  if (priorMatch) {
    for (const ms of priorMatch.matchScores) {
      runningStreaks.set(ms.userId, {
        res: ms.resStreakLenAfter,
        marcatore: ms.marcatoreStreakLenAfter,
      });
    }
  }

  const matchesToScore = await prisma.match.findMany({
    where: {
      seasonId,
      kickoffAt: { gte: fromKickoffAt },
      resultSource: { not: "NONE" },
    },
    orderBy: { kickoffAt: "asc" },
    include: { predictions: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const match of matchesToScore) {
      const official: OfficialResult = {
        homeScore: match.homeScore!,
        awayScore: match.awayScore!,
        scorerKind: match.firstScorerKind!,
        scorerPlayerName: match.firstScorerPlayerName,
      };

      const predictions: PlayerPrediction[] = match.predictions.map((p) => ({
        userId: p.userId,
        homeScore: p.predictedHomeScore,
        awayScore: p.predictedAwayScore,
        scorerKind: p.predictedScorerKind,
        scorerPlayerName: p.predictedScorerPlayerName,
      }));

      const { perPlayer, updatedStreaks } = computeMatchScores({
        official,
        predictions,
        allActivePlayerIds,
        priorStreaks: runningStreaks,
      });

      await tx.matchScore.deleteMany({ where: { matchId: match.id } });
      await tx.matchScore.createMany({
        data: [...perPlayer.values()].map((r) => ({
          matchId: match.id,
          userId: r.userId,
          resCorrect: r.resCorrect,
          marcatoreCorrect: r.marcatoreCorrect,
          resPoints: r.resPoints,
          marcatorePoints: r.marcatorePoints,
          basePoints: r.basePoints,
          comboBonus: r.comboBonus,
          resStreakLenAfter: r.resStreakLenAfter,
          marcatoreStreakLenAfter: r.marcatoreStreakLenAfter,
          resStreakBonusPct: r.resStreakBonusPct,
          marcatoreStreakBonusPct: r.marcatoreStreakBonusPct,
          streakBonusPoints: r.streakBonusPoints,
          totalPoints: r.totalPoints,
        })),
      });
      await tx.match.update({
        where: { id: match.id },
        data: { scoringComputedAt: new Date(), status: "FINISHED" },
      });

      runningStreaks = updatedStreaks;
    }

    const lastMatchId = matchesToScore.at(-1)?.id;
    for (const [userId, streak] of runningStreaks) {
      await tx.playerStreakState.upsert({
        where: { userId_seasonId: { userId, seasonId } },
        update: {
          currentResStreak: streak.res,
          currentMarcatoreStreak: streak.marcatore,
          ...(lastMatchId ? { lastMatchIdApplied: lastMatchId } : {}),
        },
        create: {
          userId,
          seasonId,
          currentResStreak: streak.res,
          currentMarcatoreStreak: streak.marcatore,
          lastMatchIdApplied: lastMatchId ?? null,
        },
      });
    }
  });
}
