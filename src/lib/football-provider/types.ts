import type { Competition, ScorerKind } from "@/generated/prisma/enums";

export interface RawFixture {
  externalRef: string;
  competition: Competition;
  opponent: string;
  isHome: boolean;
  kickoffAt: Date;
}

export interface FixtureResult {
  finished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  firstScorerKind: ScorerKind | null;
  firstScorerPlayerName: string | null;
}

// Interfaccia astratta (vedi piano): zero dipendenze da un fornitore
// specifico, cosi il provider e sostituibile con una riga di config se la
// free tier di API-Football risultasse insufficiente in futuro.
export interface FootballDataProvider {
  findUpcomingFixtures(teamId: number, daysAhead: number): Promise<RawFixture[]>;
  getFixtureResult(fixtureId: string, teamId: number): Promise<FixtureResult>;
}
