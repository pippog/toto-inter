import type { FixtureResult } from "./types";

export interface ApiFixture {
  fixture: { id: number; status: { short: string } };
  score: { fulltime: { home: number | null; away: number | null } };
}

export interface ApiGoalEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number };
  player: { name: string | null };
  type: string;
  detail: string;
  comments: string | null;
}

const FINISHED_STATUSES = ["FT", "AET", "PEN"];

// Funzione pura (nessun I/O), come il motore di scoring: prende la risposta
// grezza dell'API e ne ricava il risultato ai 90' + primo marcatore Inter.
//
// Confermato con uno spike reale (partita ai rigori, vedi piano):
// - score.fulltime è già il risultato al 90', separato da extratime/penalty
//   — non serve ricostruirlo dagli eventi.
// - i tiri di rigore del dopo-partita compaiono come eventi "Goal" con
//   elapsed:120 e comments:"Penalty Shootout": il filtro elapsed<=90 li
//   esclude già da solo, ma il controllo su comments resta esplicito qui
//   per documentare l'intento e proteggere da eventuali cambi di formato.
// - assunzione NON verificata su un autogol reale (nessuno osservato nello
//   spike): si assume che il campo `team` di un evento "Own Goal" sia la
//   squadra che ne beneficia sul tabellone (convenzione più comune tra i
//   provider di dati calcistici) — quindi un "Own Goal" con team=Inter
//   equivale a OWN_GOAL a favore dell'Inter. Se una correzione manuale
//   ammin smentisse questa lettura su una vera autorete, invertire qui.
export function deriveMatchResult(
  fixture: ApiFixture,
  events: ApiGoalEvent[],
  interTeamId: number,
): FixtureResult {
  if (!FINISHED_STATUSES.includes(fixture.fixture.status.short)) {
    return {
      finished: false,
      homeScore: null,
      awayScore: null,
      firstScorerKind: null,
      firstScorerPlayerName: null,
    };
  }

  const interGoalsWithin90 = events
    .filter(
      (e) =>
        e.type === "Goal" &&
        e.team.id === interTeamId &&
        e.time.elapsed <= 90 &&
        e.comments !== "Penalty Shootout",
    )
    .sort((a, b) => a.time.elapsed - b.time.elapsed || (a.time.extra ?? 0) - (b.time.extra ?? 0));

  const first = interGoalsWithin90[0];

  return {
    finished: true,
    homeScore: fixture.score.fulltime.home,
    awayScore: fixture.score.fulltime.away,
    firstScorerKind: !first ? "NONE" : first.detail === "Own Goal" ? "OWN_GOAL" : "PLAYER_GOAL",
    firstScorerPlayerName: !first || first.detail === "Own Goal" ? null : first.player.name,
  };
}
