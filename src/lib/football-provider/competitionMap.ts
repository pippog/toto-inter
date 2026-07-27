import type { Competition } from "@/generated/prisma/enums";

// ID lega di API-Football (verificati via /leagues durante lo spike),
// mappati sulle competizioni dell'Inter che seguiamo (vedi piano).
const LEAGUE_ID_TO_COMPETITION: Record<number, Competition> = {
  135: "SERIE_A",
  137: "COPPA_ITALIA",
  2: "CHAMPIONS_LEAGUE",
  3: "EUROPA_LEAGUE",
  667: "FRIENDLY", // "Friendlies Clubs" (verificato via /fixtures?id= su un'amichevole reale)
};

export function mapLeagueToCompetition(leagueId: number): Competition {
  return LEAGUE_ID_TO_COMPETITION[leagueId] ?? "OTHER";
}
