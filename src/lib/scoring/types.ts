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

export interface MatchScoreResult {
  userId: string;
  resCorrect: boolean;
  marcatoreCorrect: boolean;
  resPoints: number;
  marcatorePoints: number;
  basePoints: number;
  comboBonus: number;
  resStreakLenAfter: number;
  marcatoreStreakLenAfter: number;
  resStreakBonusPct: number;
  marcatoreStreakBonusPct: number;
  streakBonusPoints: number;
  totalPoints: number;
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
