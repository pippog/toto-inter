import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { prisma } from "@/lib/db";
import { applyMatchResult } from "@/lib/scoring/applyMatchResult";
import { apiFootballProvider, INTER_TEAM_ID } from "@/lib/football-provider/apiFootballProvider";

// Per ogni partita passata non ancora conclusa (e non corretta a mano —
// result_source=MANUAL vince sempre, vedi piano), interroga API-Football e,
// se conclusa, applica il risultato con lo stesso applyMatchResult usato
// dal form admin manuale: un solo percorso per il ricalcolo, sia manuale
// che automatico.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await prisma.match.findMany({
    where: {
      kickoffAt: { lt: new Date() },
      status: { not: "FINISHED" },
      resultSource: { not: "MANUAL" },
      externalRef: { not: null },
    },
    orderBy: { kickoffAt: "asc" },
  });

  const results: Array<{ matchId: string; finished: boolean; error?: string }> = [];

  // Un fixture che fallisce (es. non trovato lato API-Football) non deve
  // bloccare l'aggiornamento di tutte le partite successive nella lista:
  // isoliamo l'errore per singola partita e proseguiamo con le altre.
  for (const match of pending) {
    try {
      const result = await apiFootballProvider.getFixtureResult(match.externalRef!, INTER_TEAM_ID);

      if (!result.finished) {
        results.push({ matchId: match.id, finished: false });
        continue;
      }

      await prisma.match.update({
        where: { id: match.id },
        data: {
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          firstScorerKind: result.firstScorerKind,
          firstScorerPlayerName: result.firstScorerPlayerName,
          resultSource: "API",
        },
      });
      await applyMatchResult(match.id);
      results.push({ matchId: match.id, finished: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await prisma.syncLog.create({
        data: {
          matchId: match.id,
          provider: "API-Football",
          error: message,
        },
      });
      results.push({ matchId: match.id, finished: false, error: message });
    }
  }

  return NextResponse.json({ checked: pending.length, results });
}
