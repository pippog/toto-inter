import type { FixtureResult } from "./types";

export interface HighlightlyMatchEvent {
  team: { id: number };
  time: string; // es. "6", "45+1", "90+2"
  type: string; // "Goal" | "Own Goal" | "Penalty" | "Missed Penalty" | "Yellow Card" | ... (vedi doc)
  player: string | null;
}

export interface HighlightlyMatchDetail {
  state: {
    description: string; // "Not started" | "Finished" | "Finished after extra time" | ...
    score: { current: string | null }; // "4 - 1" (home - away)
  };
  events: HighlightlyMatchEvent[];
}

const FINISHED_DESCRIPTIONS = [
  "Finished",
  "Finished after extra time",
  "Finished after penalties",
];

// Un rigore segnato in partita è comunque un gol "giocatore" per il nostro
// ScorerKind (che distingue solo giocatore/autogol/nessuno, non il modo in
// cui è arrivato) — "Missed Penalty" resta fuori, non è un gol.
const PLAYER_SCORING_TYPES = ["Goal", "Penalty"];

function parseEventTime(time: string): { base: number; extra: number } {
  const [base, extra] = time.split("+");
  return { base: Number(base), extra: extra ? Number(extra) : 0 };
}

// Funzione pura (nessun I/O): dato il dettaglio di una partita Highlightly,
// ricava risultato ai 90' + primo marcatore della squadra `teamId`.
//
// Due assunzioni non verificate su un caso reale (nessun autogol/supplementari
// osservato durante lo spike del 2026-09-02) — se una risultasse sbagliata,
// result_source=MANUAL resta la via di correzione, come già per API-Football:
// - il campo `team` di un evento "Own Goal" è la squadra che ne beneficia sul
//   tabellone (stessa convenzione assunta in deriveResult.ts per API-Football);
// - `state.score.current` riflette sempre il risultato ai 90', anche per una
//   partita finita ai supplementari/rigori. Serie A e fase campionato di
//   Champions non vanno mai ai supplementari, quindi il rischio reale è solo
//   su eventuali turni a eliminazione diretta di Coppa Italia/Champions.
export function deriveHighlightlyResult(
  match: HighlightlyMatchDetail,
  teamId: number,
): FixtureResult {
  if (!FINISHED_DESCRIPTIONS.includes(match.state.description)) {
    return {
      finished: false,
      homeScore: null,
      awayScore: null,
      firstScorerKind: null,
      firstScorerPlayerName: null,
    };
  }

  const scoreMatch = match.state.score.current?.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!scoreMatch) {
    throw new Error(
      `Highlightly: punteggio mancante o non nel formato atteso per una partita conclusa ("${match.state.score.current}")`,
    );
  }

  // Come deriveResult.ts (API-Football): il minuto-base decide l'esclusione
  // dai 90' (un "90+2" resta dentro, un "105" o un rigore del dopo-partita
  // no), i minuti di recupero sono solo un tie-break nell'ordinamento — non
  // vanno sommati al minuto base, altrimenti "90+2" (90.02) risulterebbe
  // erroneamente escluso dal filtro <=90.
  const teamGoals = match.events
    .filter(
      (e) =>
        e.team.id === teamId &&
        (PLAYER_SCORING_TYPES.includes(e.type) || e.type === "Own Goal"),
    )
    .map((e) => ({ ...e, parsedTime: parseEventTime(e.time) }))
    .filter((e) => e.parsedTime.base <= 90)
    .sort((a, b) => a.parsedTime.base - b.parsedTime.base || a.parsedTime.extra - b.parsedTime.extra);

  const first = teamGoals[0];

  return {
    finished: true,
    homeScore: Number(scoreMatch[1]),
    awayScore: Number(scoreMatch[2]),
    firstScorerKind: !first ? "NONE" : first.type === "Own Goal" ? "OWN_GOAL" : "PLAYER_GOAL",
    firstScorerPlayerName: !first || first.type === "Own Goal" ? null : first.player,
  };
}
