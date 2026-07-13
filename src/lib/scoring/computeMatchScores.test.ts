import { describe, expect, it } from "vitest";
import {
  computeMatchScores,
  totalPointsFactoredForm,
} from "./computeMatchScores";
import type { OfficialResult, PlayerPrediction, StreakState } from "./types";

const official: OfficialResult = {
  homeScore: 2,
  awayScore: 1,
  scorerKind: "PLAYER_GOAL",
  scorerPlayerName: "Lautaro Martinez",
};

function noStreaks(userIds: string[]): Map<string, StreakState> {
  return new Map(userIds.map((id) => [id, { res: 0, marcatore: 0 }]));
}

describe("computeMatchScores", () => {
  it("singolo giocatore corretto solo sul risultato: B=1, C=0, R=0, P=1", () => {
    const predictions: PlayerPrediction[] = [
      {
        userId: "u1",
        homeScore: 2,
        awayScore: 1,
        scorerKind: "PLAYER_GOAL",
        scorerPlayerName: "Qualcun altro",
      },
    ];

    const { perPlayer } = computeMatchScores({
      official,
      predictions,
      allActivePlayerIds: ["u1"],
      priorStreaks: noStreaks(["u1"]),
    });

    const u1 = perPlayer.get("u1")!;
    expect(u1.resCorrect).toBe(true);
    expect(u1.marcatoreCorrect).toBe(false);
    expect(u1.basePoints.toNumber()).toBeCloseTo(1);
    expect(u1.comboBonus.toNumber()).toBe(0);
    expect(u1.streakBonusPoints.toNumber()).toBe(0);
    expect(u1.totalPoints.toNumber()).toBeCloseTo(1);
  });

  it("due giocatori corretti sul risultato, uno anche sul marcatore: split 1/2 + combo solo per il doppio", () => {
    const predictions: PlayerPrediction[] = [
      {
        userId: "u1",
        homeScore: 2,
        awayScore: 1,
        scorerKind: "PLAYER_GOAL",
        scorerPlayerName: "Lautaro Martinez",
      },
      {
        userId: "u2",
        homeScore: 2,
        awayScore: 1,
        scorerKind: "NONE",
        scorerPlayerName: null,
      },
    ];

    const { perPlayer } = computeMatchScores({
      official,
      predictions,
      allActivePlayerIds: ["u1", "u2"],
      priorStreaks: noStreaks(["u1", "u2"]),
    });

    const u1 = perPlayer.get("u1")!;
    const u2 = perPlayer.get("u2")!;

    // Entrambi indovinano il risultato -> 1/2 a testa.
    expect(u1.resPoints.toNumber()).toBeCloseTo(0.5);
    expect(u2.resPoints.toNumber()).toBeCloseTo(0.5);

    // Solo u1 indovina il marcatore -> tutto il punto (1/1).
    expect(u1.marcatoreCorrect).toBe(true);
    expect(u1.marcatorePoints.toNumber()).toBeCloseTo(1);
    expect(u2.marcatoreCorrect).toBe(false);
    expect(u2.marcatorePoints.toNumber()).toBe(0);

    // Combo solo per u1 (doppio corretto): +50% del suo base (0.5+1=1.5).
    expect(u1.basePoints.toNumber()).toBeCloseTo(1.5);
    expect(u1.comboBonus.toNumber()).toBeCloseTo(0.75);
    expect(u1.totalPoints.toNumber()).toBeCloseTo(2.25);

    // u2 non ha combo.
    expect(u2.comboBonus.toNumber()).toBe(0);
    expect(u2.totalPoints.toNumber()).toBeCloseTo(0.5);
  });

  it("nessuno indovina il marcatore: marcatore_points=0 per tutti, niente divisione per zero", () => {
    const predictions: PlayerPrediction[] = [
      {
        userId: "u1",
        homeScore: 2,
        awayScore: 1,
        scorerKind: "NONE",
        scorerPlayerName: null,
      },
      {
        userId: "u2",
        homeScore: 0,
        awayScore: 0,
        scorerKind: "NONE",
        scorerPlayerName: null,
      },
    ];

    const { perPlayer } = computeMatchScores({
      official,
      predictions,
      allActivePlayerIds: ["u1", "u2"],
      priorStreaks: noStreaks(["u1", "u2"]),
    });

    for (const userId of ["u1", "u2"]) {
      const result = perPlayer.get(userId)!;
      expect(result.marcatoreCorrect).toBe(false);
      expect(result.marcatorePoints.toNumber()).toBe(0);
      expect(Number.isFinite(result.totalPoints.toNumber())).toBe(true);
    }
  });

  it("streak che passa da 3 a 4 di fila: soglia sostitutiva +100%, non 30+60+100 sommate", () => {
    const predictions: PlayerPrediction[] = [
      {
        userId: "u1",
        homeScore: 2,
        awayScore: 1,
        scorerKind: "PLAYER_GOAL",
        scorerPlayerName: "Lautaro Martinez",
      },
    ];

    const { perPlayer } = computeMatchScores({
      official,
      predictions,
      allActivePlayerIds: ["u1"],
      priorStreaks: new Map([["u1", { res: 3, marcatore: 0 }]]),
    });

    const u1 = perPlayer.get("u1")!;
    expect(u1.resStreakLenAfter).toBe(4);
    expect(u1.resStreakBonusPct.toNumber()).toBeCloseTo(1.0);
    // Base = 1 (risultato) + 1 (marcatore, unico a indovinare) = 2.
    // Combo (+50%) + streak risultato (+100%) + streak marcatore (0%, primo centro).
    expect(u1.basePoints.toNumber()).toBeCloseTo(2);
    expect(u1.comboBonus.toNumber()).toBeCloseTo(1); // 0.5 * 2
    expect(u1.streakBonusPoints.toNumber()).toBeCloseTo(2); // (1.0 + 0) * 2
    expect(u1.totalPoints.toNumber()).toBeCloseTo(5); // 2 + 1 + 2
  });

  it("pronostico mancante azzera lo streak anche senza una riga precedente esplicita", () => {
    // Partita N-1: u1 assente (nessuna prediction) mentre aveva uno streak di 3.
    const predictionsMissing: PlayerPrediction[] = [];
    const { updatedStreaks: afterMiss } = computeMatchScores({
      official,
      predictions: predictionsMissing,
      allActivePlayerIds: ["u1"],
      priorStreaks: new Map([["u1", { res: 3, marcatore: 2 }]]),
    });
    expect(afterMiss.get("u1")).toEqual({ res: 0, marcatore: 0 });

    // Partita N: u1 indovina di nuovo -> streak riparte da 1, non da 4.
    const predictionsHit: PlayerPrediction[] = [
      {
        userId: "u1",
        homeScore: 2,
        awayScore: 1,
        scorerKind: "NONE",
        scorerPlayerName: null,
      },
    ];
    const { perPlayer } = computeMatchScores({
      official,
      predictions: predictionsHit,
      allActivePlayerIds: ["u1"],
      priorStreaks: afterMiss,
    });
    expect(perPlayer.get("u1")!.resStreakLenAfter).toBe(1);
    expect(perPlayer.get("u1")!.resStreakBonusPct.toNumber()).toBe(0);
  });

  it("autogol e nessun marcatore: un giocatore reale pronosticato contro un autogol ufficiale è sbagliato", () => {
    const ownGoalOfficial: OfficialResult = {
      homeScore: 1,
      awayScore: 1,
      scorerKind: "OWN_GOAL",
      scorerPlayerName: null,
    };

    const predictions: PlayerPrediction[] = [
      {
        userId: "u1",
        homeScore: 1,
        awayScore: 1,
        scorerKind: "PLAYER_GOAL",
        scorerPlayerName: "Lautaro Martinez",
      },
      {
        userId: "u2",
        homeScore: 1,
        awayScore: 1,
        scorerKind: "OWN_GOAL",
        scorerPlayerName: null,
      },
    ];

    const { perPlayer } = computeMatchScores({
      official: ownGoalOfficial,
      predictions,
      allActivePlayerIds: ["u1", "u2"],
      priorStreaks: noStreaks(["u1", "u2"]),
    });

    expect(perPlayer.get("u1")!.marcatoreCorrect).toBe(false);
    expect(perPlayer.get("u2")!.marcatoreCorrect).toBe(true);
  });

  it("forma additiva e forma fattorizzata coincidono sempre (cross-check algebrico)", () => {
    const predictions: PlayerPrediction[] = [
      {
        userId: "u1",
        homeScore: 2,
        awayScore: 1,
        scorerKind: "PLAYER_GOAL",
        scorerPlayerName: "Lautaro Martinez",
      },
      {
        userId: "u2",
        homeScore: 2,
        awayScore: 1,
        scorerKind: "PLAYER_GOAL",
        scorerPlayerName: "Lautaro Martinez",
      },
      {
        userId: "u3",
        homeScore: 0,
        awayScore: 0,
        scorerKind: "NONE",
        scorerPlayerName: null,
      },
    ];

    const { perPlayer } = computeMatchScores({
      official,
      predictions,
      allActivePlayerIds: ["u1", "u2", "u3"],
      priorStreaks: new Map([
        ["u1", { res: 1, marcatore: 3 }],
        ["u2", { res: 0, marcatore: 0 }],
      ]),
    });

    for (const result of perPlayer.values()) {
      expect(result.totalPoints.toNumber()).toBeCloseTo(
        totalPointsFactoredForm(result).toNumber(),
      );
    }
  });

  it("pronostico mancante conta come sbagliato e non riduce i denominatori W", () => {
    const predictions: PlayerPrediction[] = [
      {
        userId: "u1",
        homeScore: 2,
        awayScore: 1,
        scorerKind: "PLAYER_GOAL",
        scorerPlayerName: "Lautaro Martinez",
      },
    ];

    const { perPlayer } = computeMatchScores({
      official,
      predictions,
      allActivePlayerIds: ["u1", "u2"], // u2 non ha pronosticato
      priorStreaks: noStreaks(["u1", "u2"]),
    });

    const u1 = perPlayer.get("u1")!;
    const u2 = perPlayer.get("u2")!;
    // u1 è l'unico che ha indovinato -> prende l'intero punto, non 1/2.
    expect(u1.resPoints.toNumber()).toBeCloseTo(1);
    expect(u2.resCorrect).toBe(false);
    expect(u2.totalPoints.toNumber()).toBe(0);
  });
});
