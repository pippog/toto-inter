import type { OfficialResult, PlayerPrediction } from "./types";

export function resultMatches(
  prediction: Pick<PlayerPrediction, "homeScore" | "awayScore">,
  official: Pick<OfficialResult, "homeScore" | "awayScore">,
): boolean {
  return (
    prediction.homeScore === official.homeScore &&
    prediction.awayScore === official.awayScore
  );
}

export function scorerMatches(
  prediction: Pick<PlayerPrediction, "scorerKind" | "scorerPlayerName">,
  official: Pick<OfficialResult, "scorerKind" | "scorerPlayerName">,
): boolean {
  if (prediction.scorerKind !== official.scorerKind) return false;
  if (official.scorerKind !== "PLAYER_GOAL") return true;

  const normalize = (name: string | null) => name?.trim().toLowerCase() ?? "";
  return (
    normalize(prediction.scorerPlayerName) ===
    normalize(official.scorerPlayerName)
  );
}
