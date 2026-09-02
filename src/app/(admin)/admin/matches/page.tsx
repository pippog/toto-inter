import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { CreateMatchForm } from "./create-match-form";
import { CompetitionBadge } from "@/components/competition-badge";
import { formatItalianDateTime } from "@/lib/italianTime";
import type { Match } from "@/generated/prisma/client";

function MatchRow({ match }: { match: Match }) {
  return (
    <li>
      <Link
        href={`/admin/matches/${match.id}/result`}
        className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-3 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover"
      >
        <span className="flex items-center gap-3">
          <CompetitionBadge competition={match.competition} />
          <span>
            Inter {match.isHome ? "-" : "@"} {match.opponent} —{" "}
            {formatItalianDateTime(match.kickoffAt)}
          </span>
        </span>
        <span className="text-sm text-zinc-500">
          {match.status} / {match.resultSource}
        </span>
      </Link>
    </li>
  );
}

export default async function AdminMatchesPage() {
  await requireAdmin();

  const seasons = await prisma.season.findMany({
    orderBy: [{ isActive: "desc" }, { label: "desc" }],
    include: {
      matches: { orderBy: { kickoffAt: "asc" } },
    },
  });

  const now = new Date();
  const needsClosing = seasons
    .flatMap((s) => s.matches)
    .filter((m) => m.status !== "FINISHED" && m.kickoffAt < now)
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-heading">Gestione partite</h1>

      <CreateMatchForm />

      {needsClosing.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-red-600">
            Da chiudere ({needsClosing.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {needsClosing.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-3">
        {seasons.map((s) => (
          <details
            key={s.id}
            open={s.isActive}
            className="rounded-2xl bg-surface shadow-card [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 font-medium text-heading">
              <span className="flex items-center gap-2">
                {s.label}
                {s.isActive && (
                  <span className="rounded-full bg-inter-gold px-2 py-0.5 text-xs font-medium text-inter-navy-dark">
                    Attiva
                  </span>
                )}
              </span>
              <span className="text-sm font-normal text-zinc-500">
                {s.matches.length} partite
              </span>
            </summary>
            <ul className="flex flex-col gap-2 p-3 pt-0">
              {s.matches.length === 0 ? (
                <li className="text-sm text-zinc-500">Nessuna partita in questa stagione.</li>
              ) : (
                s.matches.map((m) => <MatchRow key={m.id} match={m} />)
              )}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
