import "server-only";
import { mapLeagueToCompetition } from "./competitionMap";
import { deriveMatchResult, type ApiFixture, type ApiGoalEvent } from "./deriveResult";
import type { FixtureResult, FootballDataProvider, RawFixture, RawSquadPlayer } from "./types";

export const INTER_TEAM_ID = 505;

const BASE_URL = "https://v3.football.api-sports.io";

// Il piano Free di API-Football rifiuta qualunque query con `season` fuori
// dal range 2022-2024 e non ha accesso al parametro `next` (verificato con
// uno spike reale): l'unico modo per scoprire le prossime partite senza
// quei parametri è interrogare `date=YYYY-MM-DD` giorno per giorno
// (ritorna tutte le partite del mondo quel giorno) e filtrare lato client
// per team.id. `date` è a sua volta limitato a una finestra mobile di
// pochi giorni attorno a oggi (verificato in produzione: un giorno fuori
// da quella finestra risponde con un errore "plan", gestito qui saltando
// il giorno) — la scoperta prossime partite arriva quindi con 1-2 giorni
// di anticipo, non settimane. Il lookup di un singolo fixture per id,
// invece, non richiede `season`/`date` e funziona senza restrizioni: è
// quello usato per il ricalcolo risultati.
class ApiFootballPlanError extends Error {}

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! },
  });
  if (!res.ok) {
    throw new Error(`API-Football ${path} → HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    const message = `API-Football ${path} → ${JSON.stringify(json.errors)}`;
    // Il piano Free limita `date=` a una finestra mobile di pochi giorni
    // attorno a oggi (verificato: rifiuta con {"plan": "..."} fuori
    // finestra). Isolato in un errore dedicato cosi il chiamante puo
    // saltare il singolo giorno invece di far fallire l'intera discovery.
    if (json.errors.plan) throw new ApiFootballPlanError(message);
    throw new Error(message);
  }
  return json.response;
}

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const apiFootballProvider: FootballDataProvider = {
  async findUpcomingFixtures(teamId, daysAhead) {
    const found: RawFixture[] = [];

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);

      let response: Array<{
        fixture: { id: number; date: string; status: { short: string } };
        league: { id: number };
        teams: {
          home: { id: number; name: string; logo: string | null };
          away: { id: number; name: string; logo: string | null };
        };
      }>;
      try {
        response = (await apiGet(`/fixtures?date=${toDateParam(date)}`)) as typeof response;
      } catch (err) {
        // Il piano Free accetta solo una finestra di pochi giorni attorno
        // a oggi: un giorno fuori da quella finestra si salta, non blocca
        // la scoperta degli altri giorni validi.
        if (err instanceof ApiFootballPlanError) continue;
        throw err;
      }

      for (const f of response) {
        const isHome = f.teams.home.id === teamId;
        const isAway = f.teams.away.id === teamId;
        if (!isHome && !isAway) continue;
        if (!["NS", "TBD"].includes(f.fixture.status.short)) continue;

        const opponentTeam = isHome ? f.teams.away : f.teams.home;
        found.push({
          externalRef: String(f.fixture.id),
          competition: mapLeagueToCompetition(f.league.id),
          opponent: opponentTeam.name,
          opponentLogoUrl: opponentTeam.logo ?? null,
          isHome,
          kickoffAt: new Date(f.fixture.date),
        });
      }
    }

    return found;
  },

  async getFixtureResult(fixtureId, teamId): Promise<FixtureResult> {
    const [fixtures, events] = await Promise.all([
      apiGet(`/fixtures?id=${fixtureId}`) as Promise<ApiFixture[]>,
      apiGet(`/fixtures/events?fixture=${fixtureId}`) as Promise<ApiGoalEvent[]>,
    ]);

    const fixture = fixtures[0];
    if (!fixture) {
      throw new Error(`API-Football: fixture ${fixtureId} non trovato`);
    }

    return deriveMatchResult(fixture, events, teamId);
  },

  async getSquad(teamId): Promise<RawSquadPlayer[]> {
    const response = (await apiGet(`/players/squads?team=${teamId}`)) as Array<{
      players: Array<{ id: number; name: string }>;
    }>;

    const squad = response[0]?.players ?? [];
    return squad.map((p) => ({ externalRef: String(p.id), name: p.name }));
  },
};
