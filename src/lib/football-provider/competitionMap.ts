import type { Competition } from "@/generated/prisma/enums";

// ID lega di API-Football (verificati via /leagues durante lo spike),
// mappati sulle competizioni dell'Inter che seguiamo (vedi piano).
const LEAGUE_ID_TO_COMPETITION: Record<number, Competition> = {
  135: "SERIE_A",
  137: "COPPA_ITALIA",
  2: "CHAMPIONS_LEAGUE",
  3: "EUROPA_LEAGUE",
};

export function mapLeagueToCompetition(leagueId: number): Competition {
  return LEAGUE_ID_TO_COMPETITION[leagueId] ?? "OTHER";
}
