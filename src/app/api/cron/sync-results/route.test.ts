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

  // Regressione Inter-Como 08/11/2026: Highlightly ha dato "Pio Esposito",
  // la rosa aveva "F. Esposito" (nome composto, iniziali diverse).
  it.each(["F. Esposito", "Pio Esposito", "P. Esposito", "F. P. Esposito", "Francesco Pio Esposito"])(
    "risolve %s contro il nome composto per esteso in rosa",
    (raw) => {
      const roster = [...players, { name: "Francesco Pio Esposito" }];
      expect(resolveCanonicalScorerName(raw, roster)).toBe("Francesco Pio Esposito");
    },
  );

  it("non risolve se lo stesso cognome con nomi compatibili è ambiguo in rosa", () => {
    const roster = [{ name: "Francesco Pio Esposito" }, { name: "Sebastiano Esposito" }, { name: "Salvatore Esposito" }];
    expect(resolveCanonicalScorerName("F. Esposito", roster)).toBe("Francesco Pio Esposito");
    expect(resolveCanonicalScorerName("S. Esposito", roster)).toBe("S. Esposito");
  });

  it("non risolve un nome senza nome proprio (solo cognome)", () => {
    expect(resolveCanonicalScorerName("Bastoni", players)).toBe("Bastoni");
  });
});
