import { describe, expect, it } from "vitest";
import { resolveCanonicalScorerName } from "./route";

const players = [
  { name: "H. Çalhanoğlu" },
  { name: "Lautaro Martínez" },
  { name: "Josep Martínez" },
  { name: "A. Bastoni" },
];

describe("resolveCanonicalScorerName", () => {
  it("risolve per fold degli accenti quando il formato coincide", () => {
    expect(resolveCanonicalScorerName("H. Calhanoglu", players)).toBe("H. Çalhanoğlu");
  });

  it("risolve un nome abbreviato contro un nome per esteso in rosa (regressione Inter-Roma 19/09/2026)", () => {
    expect(resolveCanonicalScorerName("L. Martinez", players)).toBe("Lautaro Martínez");
  });

  it("non confonde due giocatori con lo stesso cognome ma iniziale diversa", () => {
    expect(resolveCanonicalScorerName("J. Martinez", players)).toBe("Josep Martínez");
  });

  it("tiene il nome grezzo se non trova alcun match", () => {
    expect(resolveCanonicalScorerName("X. Sconosciuto", players)).toBe("X. Sconosciuto");
  });
});
