import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Target, Crosshair, Sparkles, TrendingUp } from "lucide-react";
import { getCurrentUser, getVisiblePredictions } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { PredictionForm } from "./prediction-form";
import { CompetitionBadge } from "@/components/competition-badge";
import { StatTile } from "@/components/stat-tile";
import { Timeline, TimelineItem } from "@/components/timeline";
import { Avatar } from "@/components/avatar";

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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2 rounded-2xl bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between">
          <CompetitionBadge competition={match.competition} />
          <span className="text-xs text-zinc-400">
            {match.kickoffAt.toLocaleString("it-IT", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>
        <h1 className="text-xl font-semibold text-heading">
          Inter {match.isHome ? "-" : "@"} {match.opponent}
        </h1>
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
        <div className="flex flex-col gap-2 rounded-2xl bg-surface shadow-card p-4">
          <h2 className="font-medium text-heading">Risultato ufficiale</h2>
          <p>
            {match.homeScore} - {match.awayScore} — Primo marcatore Inter:{" "}
            {scorerLabel(match.firstScorerKind!, match.firstScorerPlayerName)}
          </p>
        </div>
      )}

      {myScore && myPrediction && (
        <div className="flex flex-col gap-1 rounded-2xl bg-surface shadow-card p-4 text-sm">
          <h2 className="mb-2 font-medium text-heading">Il tuo pronostico</h2>
          <p>
            {myPrediction.predictedHomeScore}-{myPrediction.predictedAwayScore}, marcatore:{" "}
            {scorerLabel(myPrediction.predictedScorerKind, myPrediction.predictedScorerPlayerName)}
          </p>
        </div>
      )}

      {myScore && (
        <div className="flex flex-col gap-4 rounded-2xl bg-surface shadow-card p-4">
          <h2 className="font-medium text-heading">Il tuo punteggio in questa partita</h2>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile
              icon={Target}
              accent="sky"
              label={myScore.resCorrect ? `Risultato (1/${wRes} su ${totalScored})` : "Risultato"}
              value={`${Number(myScore.resPoints).toFixed(2)} pt`}
            />
            <StatTile
              icon={Crosshair}
              accent="violet"
              label={myScore.marcatoreCorrect ? `Marcatore (1/${wMarcatore} su ${totalScored})` : "Marcatore"}
              value={`${Number(myScore.marcatorePoints).toFixed(2)} pt`}
            />
            <StatTile
              icon={Sparkles}
              accent="amber"
              label="Bonus combo"
              value={`${Number(myScore.comboBonus).toFixed(2)} pt`}
            />
            <StatTile
              icon={TrendingUp}
              accent="teal"
              label={`Streak ${myScore.resStreakLenAfter}/${myScore.marcatoreStreakLenAfter}`}
              value={`${Number(myScore.streakBonusPoints).toFixed(2)} pt`}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-inter-navy-soft px-4 py-3">
            <span className="text-sm font-medium text-inter-navy">Totale partita</span>
            <span className="text-xl font-bold text-inter-navy">
              {Number(myScore.totalPoints).toFixed(2)} pt
            </span>
          </div>
        </div>
      )}

      {locked && visiblePredictions.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-card">
          <h2 className="font-medium text-heading">Pronostici di tutti</h2>
          <Timeline>
            {visiblePredictions.map((p, i) => (
              <TimelineItem
                key={p.id}
                last={i === visiblePredictions.length - 1}
                title={
                  <span className="flex items-center gap-2">
                    <Avatar name={p.user.name} size={20} />
                    {p.user.name}
                  </span>
                }
                subtitle={`Marcatore: ${scorerLabel(p.predictedScorerKind, p.predictedScorerPlayerName)}`}
                trailing={
                  <span className="font-semibold text-heading">
                    {p.predictedHomeScore}-{p.predictedAwayScore}
                  </span>
                }
              />
            ))}
          </Timeline>
        </div>
      )}
    </div>
  );
}
