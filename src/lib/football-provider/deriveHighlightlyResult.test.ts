import { describe, expect, it } from "vitest";
import { deriveHighlightlyResult, type HighlightlyMatchDetail, type HighlightlyMatchEvent } from "./deriveHighlightlyResult";

const INTER_ID = 430539;
const OPPONENT_ID = 999;

function match(description: string, score: string | null, events: HighlightlyMatchEvent[]): HighlightlyMatchDetail {
  return { state: { description, score: { current: score } }, events };
}

function goal(overrides: Partial<HighlightlyMatchEvent>): HighlightlyMatchEvent {
  return {
    time: "10",
    team: { id: INTER_ID },
    type: "Goal",
    player: "Giocatore",
    ...overrides,
  };
}

describe("deriveHighlightlyResult", () => {
  it("partita non ancora finita: nessun dato", () => {
    const result = deriveHighlightlyResult(match("Not started", null, []), INTER_ID);
    expect(result).toEqual({
      finished: false,
      homeScore: null,
      awayScore: null,
      firstScorerKind: null,
      firstScorerPlayerName: null,
    });
  });

  it("Inter segna per prima con un gol normale entro il 90'", () => {
    const events = [
      goal({ time: "55", player: "L. Martinez" }),
      goal({ time: "10", player: "M. Thuram" }),
    ];
    const result = deriveHighlightlyResult(match("Finished", "2 - 0", events), INTER_ID);
    expect(result.finished).toBe(true);
    expect(result.homeScore).toBe(2);
    expect(result.awayScore).toBe(0);
    expect(result.firstScorerKind).toBe("PLAYER_GOAL");
    expect(result.firstScorerPlayerName).toBe("M. Thuram");
  });

  it("rigore segnato in partita conta come gol giocatore", () => {
    const events = [goal({ type: "Penalty", player: "H. Calhanoglu" })];
    const result = deriveHighlightlyResult(match("Finished", "1 - 0", events), INTER_ID);
    expect(result.firstScorerKind).toBe("PLAYER_GOAL");
    expect(result.firstScorerPlayerName).toBe("H. Calhanoglu");
  });

  it("rigore sbagliato non conta come gol", () => {
    const events = [goal({ type: "Missed Penalty", player: "H. Calhanoglu" })];
    const result = deriveHighlightlyResult(match("Finished", "0 - 0", events), INTER_ID);
    expect(result.firstScorerKind).toBe("NONE");
  });

  it("autorete avversaria a favore dell'Inter: OWN_GOAL, nessun nome", () => {
    const events = [goal({ type: "Own Goal", player: "Difensore avversario" })];
    const result = deriveHighlightlyResult(match("Finished", "1 - 0", events), INTER_ID);
    expect(result.firstScorerKind).toBe("OWN_GOAL");
    expect(result.firstScorerPlayerName).toBeNull();
  });

  it("l'Inter non segna entro il 90': NONE", () => {
    const events = [goal({ team: { id: OPPONENT_ID } })];
    const result = deriveHighlightlyResult(match("Finished", "0 - 1", events), INTER_ID);
    expect(result.firstScorerKind).toBe("NONE");
    expect(result.firstScorerPlayerName).toBeNull();
  });

  it("gol Inter ai supplementari (minuto base >90) ignorato: conta solo il 90'", () => {
    const events = [goal({ time: "105", player: "Supplementari" })];
    const result = deriveHighlightlyResult(match("Finished after extra time", "1 - 0", events), INTER_ID);
    expect(result.finished).toBe(true);
    expect(result.firstScorerKind).toBe("NONE");
  });

  it("gol nel recupero del secondo tempo (90+2) resta dentro i 90'", () => {
    const events = [goal({ time: "90+2", player: "Recupero" })];
    const result = deriveHighlightlyResult(match("Finished", "1 - 0", events), INTER_ID);
    expect(result.firstScorerKind).toBe("PLAYER_GOAL");
    expect(result.firstScorerPlayerName).toBe("Recupero");
  });

  it("punteggio mancante su partita conclusa: errore esplicito", () => {
    expect(() => deriveHighlightlyResult(match("Finished", null, []), INTER_ID)).toThrow();
  });
});
