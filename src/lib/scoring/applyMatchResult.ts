import "server-only";
import { prisma } from "@/lib/db";
import { computeMatchScores } from "./computeMatchScores";
import type { OfficialResult, PlayerPrediction, StreakState } from "./types";

// Punto unico di ingresso: sia per calcolare una partita appena conclusa sia
// per correggere un risultato passato, si passa sempre da qui. Sotto Season/
// Match condivisi tra leghe (vedi piano), una partita reale può interessare
// più leghe che seguono la stessa squadra: si ricalcola ciascuna lega
// indipendentemente (recomputeLeagueSeasonFrom), poi si marca la partita
// come "calcolata" una volta sola, non per ogni lega.
//
// Guardia stagioni storiche: allActivePlayerIds (sotto) riflette lo stato
// ACTIVE odierno degli utenti, non chi giocava davvero all'epoca. Le
// stagioni storiche importate (2023-24/2024-25/2025-26, vedi piano)
// includono account ormai DISABLED apposta, con MatchScore reali da
// preservare — un ricalcolo li escluderebbe dai denominatori wRes/wMar e
// gonfierebbe silenziosamente i punti già mostrati a tutti gli altri
// (verificato: differenze reali fino al 40% su dati di staging). Il
// meccanismo che ha prodotto quei punteggi storici non è riproducibile qui,
// quindi il ricalcolo è bloccato per qualunque stagione non attiva, invece
// di tentare di indovinarne la formula.
export async function applyMatchResult(matchId: string) {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: { season: true },
  });

  if (!match.season.isActive) {
    throw new Error(
      `Impossibile ricalcolare i punteggi: la stagione "${match.season.label}" non è quella attiva. ` +
        "I punteggi delle stagioni storiche sono congelati: un ricalcolo userebbe il roster odierno invece di quello dell'epoca, alterando punteggi già mostrati.",
    );
  }

  const leagues = await prisma.league.findMany({
    where: { teamId: match.teamId },
    select: { id: true },
  });

  for (const league of leagues) {
    await recomputeLeagueSeasonFrom(league.id, match.seasonId, match.kickoffAt);
  }

  // Stessa condizione usata da recomputeLeagueSeasonFrom per selezionare
  // matchesToScore: qui si applica una volta sola, indipendentemente da
  // quante leghe seguono questa squadra.
  await prisma.match.updateMany({
    where: {
      seasonId: match.seasonId,
      teamId: match.teamId,
      kickoffAt: { gte: match.kickoffAt },
      resultSource: { not: "NONE" },
    },
    data: { scoringComputedAt: new Date(), status: "FINISHED" },
  });
}

export async function recomputeLeagueSeasonFrom(
  leagueId: string,
  seasonId: string,
  fromKickoffAt: Date,
) {
  const league = await prisma.league.findUniqueOrThrow({
    where: { id: leagueId },
  });

  const memberships = await prisma.leagueMembership.findMany({
    where: { leagueId, user: { status: "ACTIVE" } },
    select: { userId: true },
  });
  const allActivePlayerIds = memberships.map((m) => m.userId);

  // Streak di partenza = quelle risultanti dall'ultima partita già calcolata
  // prima di fromKickoffAt in questa stagione per questa lega (0 se non ce
  // n'è nessuna). Filtro per teamId necessario: sotto Season condivisa, una
  // stessa stagione può contenere partite di squadre diverse.
  const priorMatch = await prisma.match.findFirst({
    where: {
      seasonId,
      teamId: league.teamId,
      kickoffAt: { lt: fromKickoffAt },
      scoringComputedAt: { not: null },
    },
    orderBy: { kickoffAt: "desc" },
    include: { matchScores: { where: { leagueId } } },
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
      teamId: league.teamId,
      kickoffAt: { gte: fromKickoffAt },
      resultSource: { not: "NONE" },
    },
    orderBy: { kickoffAt: "asc" },
    include: { predictions: true },
  });

  // Transazione indipendente per lega: un fallimento sul ricalcolo di una
  // lega non deve bloccare le altre leghe che seguono la stessa squadra.
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

      await tx.matchScore.deleteMany({ where: { matchId: match.id, leagueId } });
      await tx.matchScore.createMany({
        data: [...perPlayer.values()].map((r) => ({
          matchId: match.id,
          userId: r.userId,
          leagueId,
          resCorrect: r.resCorrect,
          marcatoreCorrect: r.marcatoreCorrect,
          resPoints: r.resPoints.toString(),
          marcatorePoints: r.marcatorePoints.toString(),
          basePoints: r.basePoints.toString(),
          comboBonus: r.comboBonus.toString(),
          resStreakLenAfter: r.resStreakLenAfter,
          marcatoreStreakLenAfter: r.marcatoreStreakLenAfter,
          resStreakBonusPct: r.resStreakBonusPct.toString(),
          marcatoreStreakBonusPct: r.marcatoreStreakBonusPct.toString(),
          streakBonusPoints: r.streakBonusPoints.toString(),
          totalPoints: r.totalPoints.toString(),
        })),
      });

      runningStreaks = updatedStreaks;
    }

    const lastMatchId = matchesToScore.at(-1)?.id;
    for (const [userId, streak] of runningStreaks) {
      await tx.playerStreakState.upsert({
        where: { userId_seasonId_leagueId: { userId, seasonId, leagueId } },
        update: {
          currentResStreak: streak.res,
          currentMarcatoreStreak: streak.marcatore,
          ...(lastMatchId ? { lastMatchIdApplied: lastMatchId } : {}),
        },
        create: {
          userId,
          seasonId,
          leagueId,
          currentResStreak: streak.res,
          currentMarcatoreStreak: streak.marcatore,
          lastMatchIdApplied: lastMatchId ?? null,
        },
      });
    }
  });
}
