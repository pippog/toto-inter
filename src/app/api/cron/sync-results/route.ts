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
  });

  const results: Array<{ matchId: string; finished: boolean }> = [];

  for (const match of pending) {
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
  }

  return NextResponse.json({ checked: pending.length, results });
}
