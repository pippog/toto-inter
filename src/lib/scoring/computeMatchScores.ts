import Decimal from "decimal.js";
import { resultMatches, scorerMatches } from "./compare";
import { streakBonusPct } from "./streakBonus";
import type {
  ComputeMatchScoresInput,
  ComputeMatchScoresOutput,
  MatchScoreResult,
  StreakState,
} from "./types";

const ZERO = new Decimal(0);
const HALF = new Decimal(0.5);

const ZERO_STREAK: StreakState = { res: 0, marcatore: 0 };

// Motore di scoring puro (nessun I/O). Implementa la formula del
// regolamento: per ogni giocatore attivo della stagione (anche chi non ha
// pronosticato, trattato come "sbagliato" su entrambi i componenti),
// calcola base, bonus combo e bonus streak sulla singola partita.
export function computeMatchScores(
  input: ComputeMatchScoresInput,
): ComputeMatchScoresOutput {
  const { official, predictions, allActivePlayerIds, priorStreaks } = input;

  const predictionByUser = new Map(predictions.map((p) => [p.userId, p]));

  // Prima passata: chi ha indovinato ciascun componente, per calcolare i
  // denominatori W_res/W_mar (i pronostici mancanti non contano mai).
  const resCorrectByUser = new Map<string, boolean>();
  const marcatoreCorrectByUser = new Map<string, boolean>();

  for (const userId of allActivePlayerIds) {
    const prediction = predictionByUser.get(userId);
    const resCorrect = prediction ? resultMatches(prediction, official) : false;
    const marcatoreCorrect = prediction
      ? scorerMatches(prediction, official)
      : false;
    resCorrectByUser.set(userId, resCorrect);
    marcatoreCorrectByUser.set(userId, marcatoreCorrect);
  }

  const wRes = [...resCorrectByUser.values()].filter(Boolean).length;
  const wMar = [...marcatoreCorrectByUser.values()].filter(Boolean).length;

  const perPlayer = new Map<string, MatchScoreResult>();
  const updatedStreaks = new Map<string, StreakState>();

  for (const userId of allActivePlayerIds) {
    const resCorrect = resCorrectByUser.get(userId) ?? false;
    const marcatoreCorrect = marcatoreCorrectByUser.get(userId) ?? false;

    // Se W è 0 nessuno entra mai nel ramo "corretto" per quel componente:
    // il punto semplicemente non viene assegnato, senza divisione per zero.
    const resPoints = resCorrect ? new Decimal(1).dividedBy(wRes) : ZERO;
    const marcatorePoints = marcatoreCorrect
      ? new Decimal(1).dividedBy(wMar)
      : ZERO;
    const basePoints = resPoints.plus(marcatorePoints);

    const comboBonus =
      resCorrect && marcatoreCorrect ? basePoints.times(HALF) : ZERO;

    const prior = priorStreaks.get(userId) ?? ZERO_STREAK;
    const resStreakLenAfter = resCorrect ? prior.res + 1 : 0;
    const marcatoreStreakLenAfter = marcatoreCorrect ? prior.marcatore + 1 : 0;

    const resStreakBonusPct = streakBonusPct(resStreakLenAfter);
    const marcatoreStreakBonusPct = streakBonusPct(marcatoreStreakLenAfter);
    const streakBonusPoints = resStreakBonusPct
      .plus(marcatoreStreakBonusPct)
      .times(basePoints);

    const totalPoints = basePoints.plus(comboBonus).plus(streakBonusPoints);

    perPlayer.set(userId, {
      userId,
      resCorrect,
      marcatoreCorrect,
      resPoints,
      marcatorePoints,
      basePoints,
      comboBonus,
      resStreakLenAfter,
      marcatoreStreakLenAfter,
      resStreakBonusPct,
      marcatoreStreakBonusPct,
      streakBonusPoints,
      totalPoints,
    });

    updatedStreaks.set(userId, {
      res: resStreakLenAfter,
      marcatore: marcatoreStreakLenAfter,
    });
  }

  return { perPlayer, updatedStreaks };
}

// Forma fattorizzata equivalente a B + C + R, usata solo come cross-check
// nei test per intercettare eventuali errori algebrici nella scomposizione
// additiva sopra.
export function totalPointsFactoredForm(result: MatchScoreResult): Decimal {
  const comboFlag = result.resCorrect && result.marcatoreCorrect ? 1 : 0;
  return result.basePoints.times(
    new Decimal(1)
      .plus(HALF.times(comboFlag))
      .plus(result.resStreakBonusPct)
      .plus(result.marcatoreStreakBonusPct),
  );
}
