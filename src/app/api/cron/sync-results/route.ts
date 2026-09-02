import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { prisma } from "@/lib/db";
import { applyMatchResult } from "@/lib/scoring/applyMatchResult";
import { highlightlyProvider, INTER_TEAM_ID } from "@/lib/football-provider/highlightlyProvider";

const DIACRITICS_PATTERN = new RegExp("[̀-ͯ]", "g");

function foldAccents(name: string): string {
  return name.normalize("NFD").replace(DIACRITICS_PATTERN, "").toLowerCase().trim();
}

// Highlightly restituisce i nomi marcatore in ASCII puro ("H. Calhanoglu"),
// mentre la rosa (Player, sincronizzata l'ultima volta da API-Football e
// congelata fino al prossimo mercato) li ha con gli accenti originali
// ("H. Çalhanoğlu"). Il confronto in scorerMatches (compare.ts) è una
// uguaglianza esatta case-insensitive, quindi senza questo passaggio il
// marcatore risulterebbe sempre "sbagliato" per ogni pronostico su un
// giocatore con nome accentato. Se il giocatore non è (più) in rosa, si
// tiene il nome grezzo del provider — non c'è nulla con cui riconciliarlo.
function resolveCanonicalScorerName(rawName: string, players: { name: string }[]): string {
  const folded = foldAccents(rawName);
  return players.find((p) => foldAccents(p.name) === folded)?.name ?? rawName;
}

// Per ogni partita passata non ancora conclusa (e non corretta a mano —
// result_source=MANUAL vince sempre, vedi piano), interroga Highlightly e,
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
  const players = await prisma.player.findMany({ select: { name: true } });

  // Un fixture che fallisce (es. non trovato lato Highlightly) non deve
  // bloccare l'aggiornamento di tutte le partite successive nella lista:
  // isoliamo l'errore per singola partita e proseguiamo con le altre.
  for (const match of pending) {
    try {
      const result = await highlightlyProvider.getFixtureResult(match.externalRef!, INTER_TEAM_ID);

      if (!result.finished) {
        results.push({ matchId: match.id, finished: false });
        continue;
      }

      const firstScorerPlayerName =
        result.firstScorerKind === "PLAYER_GOAL" && result.firstScorerPlayerName
          ? resolveCanonicalScorerName(result.firstScorerPlayerName, players)
          : result.firstScorerPlayerName;

      await prisma.match.update({
        where: { id: match.id },
        data: {
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          firstScorerKind: result.firstScorerKind,
          firstScorerPlayerName,
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
          provider: "Highlightly",
          error: message,
        },
      });
      results.push({ matchId: match.id, finished: false, error: message });
    }
  }

  return NextResponse.json({ checked: pending.length, results });
}
