const SCORER_LABELS: Record<string, string> = {
  PLAYER_GOAL: "Giocatore",
  OWN_GOAL: "Autogol (a favore dell'Inter)",
  NONE: "Nessun marcatore",
};

export function scorerLabel(kind: string, playerName: string | null): string {
  if (kind === "PLAYER_GOAL") return playerName ?? "Giocatore";
  return SCORER_LABELS[kind] ?? kind;
}
