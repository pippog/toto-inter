import "server-only";
import { mapHighlightlyLeagueToCompetition } from "./highlightlyCompetitionMap";
import { deriveHighlightlyResult, type HighlightlyMatchDetail } from "./deriveHighlightlyResult";
import type { FixtureResult, FootballDataProvider, RawFixture } from "./types";

// Id squadra Inter su Highlightly (verificato via /teams?name=Inter durante
// lo spike del 2026-09-02: due risultati per "Inter", questo è quello con
// logo e le cui partite corrispondono al calendario reale — l'altro,
// 22257838, non ha né logo né dati). Spazio di id diverso da quello di
// API-Football (INTER_TEAM_ID=505 in apiFootballProvider.ts).
export const INTER_TEAM_ID = 430539;

const BASE_URL = "https://soccer.highlightly.net";
const PAGE_LIMIT = 100;

interface HighlightlyMatchListItem {
  id: number;
  date: string;
  state: { description: string };
  awayTeam: { id: number; name: string; logo: string | null };
  homeTeam: { id: number; name: string; logo: string | null };
  league: { id: number };
}

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-rapidapi-key": process.env.HIGHLIGHTLY_API_KEY! },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Highlightly ${path} → HTTP ${res.status} ${JSON.stringify(json)}`);
  }
  return json;
}

// Le stagioni europee sono etichettate con l'anno di inizio (una partita di
// gennaio 2027 è ancora "season 2026", verificato via /leagues durante lo
// spike). Serve solo per restringere /matches alla stagione corrente: senza
// questo filtro l'endpoint torna *tutto* lo storico della squadra (oltre
// 200 partite per l'Inter, dal 2023), sprecando chiamate sulla quota
// giornaliera del piano Basic (100/giorno) per partite già concluse da anni
// che comunque il filtro "Not started" scarterebbe subito dopo.
function currentSeasonYear(): number {
  const now = new Date();
  const month = now.getUTCMonth(); // 0 = gennaio
  return month >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

// A differenza del piano Free di API-Football (finestra mobile di pochi
// giorni), qui una singola coppia di chiamate home/away restituisce l'intero
// calendario noto della squadra per la stagione: nessun bisogno di scorrere
// giorno per giorno. `daysAhead` resta nella firma solo per compatibilità
// con l'interfaccia condivisa (vedi apiFootballProvider.ts, non più attivo).
async function findSeasonMatches(teamSide: "homeTeamId" | "awayTeamId", teamId: number) {
  const season = currentSeasonYear();
  const all: HighlightlyMatchListItem[] = [];
  let offset = 0;

  for (;;) {
    const response = (await apiGet(
      `/matches?${teamSide}=${teamId}&season=${season}&offset=${offset}&limit=${PAGE_LIMIT}`,
    )) as { data: HighlightlyMatchListItem[]; pagination: { totalCount: number } };

    all.push(...response.data);
    offset += response.data.length;
    if (offset >= response.pagination.totalCount || response.data.length === 0) break;
  }

  return all;
}

export const highlightlyProvider: FootballDataProvider = {
  async findUpcomingFixtures(teamId, _daysAhead): Promise<RawFixture[]> {
    const [homeMatches, awayMatches] = await Promise.all([
      findSeasonMatches("homeTeamId", teamId),
      findSeasonMatches("awayTeamId", teamId),
    ]);

    return [...homeMatches, ...awayMatches]
      .filter((m) => m.state.description === "Not started")
      .map((m) => {
        const isHome = m.homeTeam.id === teamId;
        const opponentTeam = isHome ? m.awayTeam : m.homeTeam;
        return {
          externalRef: String(m.id),
          competition: mapHighlightlyLeagueToCompetition(m.league.id),
          opponent: opponentTeam.name,
          opponentLogoUrl: opponentTeam.logo,
          isHome,
          kickoffAt: new Date(m.date),
        };
      });
  },

  async getFixtureResult(fixtureId, teamId): Promise<FixtureResult> {
    const response = (await apiGet(`/matches/${fixtureId}`)) as HighlightlyMatchDetail[];
    const match = response[0];
    if (!match) {
      throw new Error(`Highlightly: partita ${fixtureId} non trovata`);
    }
    return deriveHighlightlyResult(match, teamId);
  },
};
