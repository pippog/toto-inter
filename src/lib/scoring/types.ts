import type Decimal from "decimal.js";

export type ScorerKind = "PLAYER_GOAL" | "OWN_GOAL" | "NONE";

export interface OfficialResult {
  homeScore: number;
  awayScore: number;
  scorerKind: ScorerKind;
  // Rilevante solo se scorerKind === "PLAYER_GOAL".
  scorerPlayerName: string | null;
}

export interface PlayerPrediction {
  userId: string;
  homeScore: number;
  awayScore: number;
  scorerKind: ScorerKind;
  scorerPlayerName: string | null;
}

export interface StreakState {
  res: number;
  marcatore: number;
}

// Tutti i punteggi come Decimal, mai number/float: si accumulano frazioni
// come 1/12 moltiplicate per bonus percentuali, e il motore rigioca
// l'intera stagione a ogni correzione (vedi piano, sezione hardening).
export interface MatchScoreResult {
  userId: string;
  resCorrect: boolean;
  marcatoreCorrect: boolean;
  resPoints: Decimal;
  marcatorePoints: Decimal;
  basePoints: Decimal;
  comboBonus: Decimal;
  resStreakLenAfter: number;
  marcatoreStreakLenAfter: number;
  resStreakBonusPct: Decimal;
  marcatoreStreakBonusPct: Decimal;
  streakBonusPoints: Decimal;
  totalPoints: Decimal;
}

export interface ComputeMatchScoresInput {
  official: OfficialResult;
  predictions: PlayerPrediction[];
  // Tutti i giocatori attivi della stagione, inclusi quelli senza pronostico
  // per questa partita (pronostico mancante = valore "sbagliato").
  allActivePlayerIds: string[];
  // Streak precedenti a questa partita, per utente. Un utente assente da
  // questa mappa è equivalente a { res: 0, marcatore: 0 }.
  priorStreaks: Map<string, StreakState>;
}

export interface ComputeMatchScoresOutput {
  perPlayer: Map<string, MatchScoreResult>;
  updatedStreaks: Map<string, StreakState>;
}
