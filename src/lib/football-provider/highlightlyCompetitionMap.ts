import type { Competition } from "@/generated/prisma/enums";

// ID lega di Highlightly (verificati via /leagues e /matches durante lo
// spike del 2026-09-02 con la chiave reale), mappati sulle competizioni
// dell'Inter che seguiamo. Spazio di id completamente diverso da quello di
// API-Football (competitionMap.ts) — provider diversi, id diversi.
const LEAGUE_ID_TO_COMPETITION: Record<number, Competition> = {
  115669: "SERIE_A", // "Serie A" italiana — occhio, esiste anche una "Serie A" brasiliana (id 61205)
  117371: "COPPA_ITALIA",
  2486: "CHAMPIONS_LEAGUE",
  3337: "EUROPA_LEAGUE",
  568401: "FRIENDLY", // "Friendlies Clubs"
};

export function mapHighlightlyLeagueToCompetition(leagueId: number): Competition {
  return LEAGUE_ID_TO_COMPETITION[leagueId] ?? "OTHER";
}
