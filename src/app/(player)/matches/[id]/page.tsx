import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser, getVisiblePredictions } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { PredictionForm } from "./prediction-form";

const COMPETITION_LABELS: Record<string, string> = {
  SERIE_A: "Serie A",
  COPPA_ITALIA: "Coppa Italia",
  CHAMPIONS_LEAGUE: "Champions League",
  EUROPA_LEAGUE: "Europa League",
  FRIENDLY: "Amichevole",
  OTHER: "Altro",
};

const SCORER_LABELS: Record<string, string> = {
  PLAYER_GOAL: "Giocatore",
  OWN_GOAL: "Autogol (a favore dell'Inter)",
  NONE: "Nessun marcatore",
};

function scorerLabel(kind: string, playerName: string | null) {
  if (kind === "PLAYER_GOAL") return playerName ?? "Giocatore";
  return SCORER_LABELS[kind] ?? kind;
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) notFound();

  await connection();
  // eslint-disable-next-line react-hooks/purity -- il rule non riconosce connection() come guardia: sopra forza la valutazione a request time.
  const locked = Date.now() >= match.predictionDeadlineAt.getTime();
  const visiblePredictions = await getVisiblePredictions(id);
  const myPrediction = visiblePredictions.find((p) => p.userId === user.id);

  const squadNames = locked
    ? []
    : (
        await prisma.player.findMany({
          where: { active: true },
          orderBy: { name: "asc" },
          select: { name: true },
        })
      ).map((p) => p.name);

  const allScores = match.status === "FINISHED"
    ? await prisma.matchScore.findMany({ where: { matchId: id } })
    : [];
  const myScore = allScores.find((s) => s.userId === user.id) ?? null;
  const wRes = allScores.filter((s) => s.resCorrect).length;
  const wMarcatore = allScores.filter((s) => s.marcatoreCorrect).length;
  const totalScored = allScores.length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold text-inter-navy">
          Inter {match.isHome ? "-" : "@"} {match.opponent}
        </h1>
        <p className="text-sm text-zinc-500">
          {COMPETITION_LABELS[match.competition] ?? match.competition} —{" "}
          {match.kickoffAt.toLocaleString("it-IT", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>

      {!locked && (
        <PredictionForm
          matchId={id}
          initial={myPrediction ?? null}
          squad={squadNames}
          opponent={match.opponent}
          isHome={match.isHome}
        />
      )}

      {locked && !myScore && (
        <p className="text-sm text-zinc-500">
          I pronostici sono chiusi. In attesa del risultato ufficiale.
        </p>
      )}

      {match.status === "FINISHED" && (
        <div className="flex flex-col gap-2 rounded-xl border border-black/10 p-4">
          <h2 className="font-medium text-inter-navy">Risultato ufficiale</h2>
          <p>
            {match.homeScore} - {match.awayScore} — Primo marcatore Inter:{" "}
            {scorerLabel(match.firstScorerKind!, match.firstScorerPlayerName)}
          </p>
        </div>
      )}

      {myScore && myPrediction && (
        <div className="flex flex-col gap-1 rounded-xl border border-black/10 p-4 text-sm">
          <h2 className="mb-2 font-medium text-inter-navy">Il tuo pronostico</h2>
          <p>
            {myPrediction.predictedHomeScore}-{myPrediction.predictedAwayScore}, marcatore:{" "}
            {scorerLabel(myPrediction.predictedScorerKind, myPrediction.predictedScorerPlayerName)}
          </p>
        </div>
      )}

      {myScore && (
        <div className="flex flex-col gap-1 rounded-xl border border-black/10 p-4 text-sm">
          <h2 className="mb-2 font-medium text-inter-navy">Il tuo punteggio in questa partita</h2>
          <p>
            Risultato indovinato: {myScore.resCorrect ? "sì" : "no"}
            {myScore.resCorrect && ` (${wRes} su ${totalScored} hanno indovinato, quindi valeva 1/${wRes})`}
            {" "}— {Number(myScore.resPoints).toFixed(3)} pt
          </p>
          <p>
            Marcatore indovinato: {myScore.marcatoreCorrect ? "sì" : "no"}
            {myScore.marcatoreCorrect && ` (${wMarcatore} su ${totalScored} hanno indovinato, quindi valeva 1/${wMarcatore})`}
            {" "}— {Number(myScore.marcatorePoints).toFixed(3)} pt
          </p>
          <p>Base: {Number(myScore.basePoints).toFixed(3)} pt</p>
          <p>Bonus combo: {Number(myScore.comboBonus).toFixed(3)} pt</p>
          <p>
            Streak risultato: {myScore.resStreakLenAfter} ({(Number(myScore.resStreakBonusPct) * 100).toFixed(0)}%) —
            Streak marcatore: {myScore.marcatoreStreakLenAfter} ({(Number(myScore.marcatoreStreakBonusPct) * 100).toFixed(0)}%)
          </p>
          <p>Bonus streak: {Number(myScore.streakBonusPoints).toFixed(3)} pt</p>
          <p className="mt-2 font-semibold text-inter-navy">
            Totale: {Number(myScore.totalPoints).toFixed(3)} pt
          </p>
        </div>
      )}

      {locked && (
        <div className="flex flex-col gap-2">
          <h2 className="font-medium text-inter-navy">Pronostici {locked ? "" : "(nascosti fino al deadline)"}</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {visiblePredictions.map((p) => (
              <li key={p.id}>
                {p.user.name}: {p.predictedHomeScore}-{p.predictedAwayScore}, marcatore:{" "}
                {scorerLabel(p.predictedScorerKind, p.predictedScorerPlayerName)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
