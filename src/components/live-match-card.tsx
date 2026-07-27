import Link from "next/link";
import type { Competition, ScorerKind } from "@/generated/prisma/enums";
import { CompetitionBadge } from "@/components/competition-badge";
import { TeamBadge } from "@/components/team-badge";
import { Avatar } from "@/components/avatar";
import { Timeline, TimelineItem } from "@/components/timeline";
import { scorerLabel } from "@/lib/scorer";

export function LiveMatchCard({
  match,
  predictions,
}: {
  match: {
    id: string;
    opponent: string;
    opponentLogoUrl: string | null;
    isHome: boolean;
    competition: Competition;
  };
  predictions: Array<{
    id: string;
    userId: string;
    predictedHomeScore: number;
    predictedAwayScore: number;
    predictedScorerKind: ScorerKind;
    predictedScorerPlayerName: string | null;
    user: { id: string; name: string };
  }>;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-accent-rose/20 bg-surface p-5 shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-semibold tracking-wide text-accent-rose">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-rose opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-accent-rose" />
          </span>
          IN CORSO
        </span>
        <CompetitionBadge competition={match.competition} />
      </div>

      <Link
        href={`/matches/${match.id}`}
        className="flex items-center justify-center gap-3 text-lg font-semibold text-heading transition-colors hover:text-inter-navy"
      >
        <TeamBadge
          label={match.isHome ? "Inter" : match.opponent}
          variant={match.isHome ? "inter" : "opponent"}
          logoUrl={match.opponentLogoUrl}
          size={9}
        />
        <span>{match.isHome ? "Inter" : match.opponent}</span>
        <span className="text-sm font-normal text-zinc-400">{match.isHome ? "-" : "@"}</span>
        <span>{match.isHome ? match.opponent : "Inter"}</span>
        <TeamBadge
          label={match.isHome ? match.opponent : "Inter"}
          variant={match.isHome ? "opponent" : "inter"}
          logoUrl={match.opponentLogoUrl}
          size={9}
        />
      </Link>

      {predictions.length > 0 && (
        <Timeline>
          {predictions.map((p, i) => (
            <TimelineItem
              key={p.id}
              last={i === predictions.length - 1}
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
      )}
    </section>
  );
}
