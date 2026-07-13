import { describe, expect, it } from "vitest";
import { deriveMatchResult, type ApiFixture, type ApiGoalEvent } from "./deriveResult";

const INTER_ID = 505;
const OPPONENT_ID = 999;

function fixture(status: string, home: number | null, away: number | null): ApiFixture {
  return { fixture: { id: 1, status: { short: status } }, score: { fulltime: { home, away } } };
}

function goal(overrides: Partial<ApiGoalEvent>): ApiGoalEvent {
  return {
    time: { elapsed: 10, extra: null },
    team: { id: INTER_ID },
    player: { name: "Giocatore" },
    type: "Goal",
    detail: "Normal Goal",
    comments: null,
    ...overrides,
  };
}

describe("deriveMatchResult", () => {
  it("partita non ancora finita: nessun dato", () => {
    const result = deriveMatchResult(fixture("NS", null, null), [], INTER_ID);
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
      goal({ time: { elapsed: 55, extra: null }, player: { name: "Lautaro Martinez" } }),
      goal({ time: { elapsed: 10, extra: null }, player: { name: "Thuram" } }),
    ];
    const result = deriveMatchResult(fixture("FT", 2, 0), events, INTER_ID);
    expect(result.finished).toBe(true);
    expect(result.homeScore).toBe(2);
    expect(result.awayScore).toBe(0);
    expect(result.firstScorerKind).toBe("PLAYER_GOAL");
    expect(result.firstScorerPlayerName).toBe("Thuram");
  });

  it("autorete avversaria a favore dell'Inter: OWN_GOAL, nessun nome", () => {
    const events = [goal({ detail: "Own Goal", player: { name: "Difensore avversario" } })];
    const result = deriveMatchResult(fixture("FT", 1, 0), events, INTER_ID);
    expect(result.firstScorerKind).toBe("OWN_GOAL");
    expect(result.firstScorerPlayerName).toBeNull();
  });

  it("l'Inter non segna entro il 90': NONE", () => {
    const events = [goal({ team: { id: OPPONENT_ID } })];
    const result = deriveMatchResult(fixture("FT", 0, 1), events, INTER_ID);
    expect(result.firstScorerKind).toBe("NONE");
    expect(result.firstScorerPlayerName).toBeNull();
  });

  it("gol Inter ai supplementari (elapsed>90) ignorato: conta solo il 90'", () => {
    const events = [
      goal({ time: { elapsed: 105, extra: null }, player: { name: "Supplementari" } }),
    ];
    const result = deriveMatchResult(fixture("AET", 1, 0), events, INTER_ID);
    expect(result.finished).toBe(true);
    expect(result.firstScorerKind).toBe("NONE");
  });

  it("rigori del dopo-partita (elapsed 120, Penalty Shootout) esclusi anche se team combacia", () => {
    const events = [
      goal({
        time: { elapsed: 120, extra: 1 },
        detail: "Penalty",
        comments: "Penalty Shootout",
        player: { name: "Rigorista" },
      }),
    ];
    const result = deriveMatchResult(fixture("PEN", 1, 1), events, INTER_ID);
    expect(result.firstScorerKind).toBe("NONE");
  });

  it("caso reale osservato nello spike (O'Higgins-Ñublense ai rigori): squadre diverse dall'Inter, nessun marcatore Inter, punteggio ai 90' preso da fulltime", () => {
    const events: ApiGoalEvent[] = [
      {
        time: { elapsed: 68, extra: null },
        team: { id: 2320 },
        player: { name: "F. Gonzalez" },
        type: "Goal",
        detail: "Penalty",
        comments: null,
      },
      {
        time: { elapsed: 120, extra: 1 },
        team: { id: 2320 },
        player: { name: "F. Gonzalez" },
        type: "Goal",
        detail: "Penalty",
        comments: "Penalty Shootout",
      },
    ];
    const result = deriveMatchResult(fixture("PEN", 1, 0), events, INTER_ID);
    expect(result.finished).toBe(true);
    expect(result.homeScore).toBe(1);
    expect(result.awayScore).toBe(0);
    expect(result.firstScorerKind).toBe("NONE");
  });
});
