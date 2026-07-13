import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser, getActiveSeason } from "@/lib/dal";
import { prisma } from "@/lib/db";

const COMPETITION_LABELS: Record<string, string> = {
  SERIE_A: "Serie A",
  COPPA_ITALIA: "Coppa Italia",
  CHAMPIONS_LEAGUE: "Champions League",
  EUROPA_LEAGUE: "Europa League",
  FRIENDLY: "Amichevole",
  OTHER: "Altro",
};

const STATUS_STYLES: Record<string, string> = {
  Conclusa: "bg-zinc-100 text-zinc-600",
  "Pronostici chiusi": "bg-zinc-100 text-zinc-600",
  Pronosticato: "bg-inter-navy/10 text-inter-navy",
  "Da pronosticare": "bg-inter-gold/20 text-inter-navy-dark",
};

function TeamBadge({ label, variant }: { label: string; variant: "inter" | "opponent" }) {
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        variant === "inter"
          ? "bg-gradient-to-br from-inter-navy to-inter-black text-white"
          : "bg-zinc-100 text-zinc-500"
      }`}
    >
      {variant === "inter" ? "IN" : label.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default async function MatchesPage() {
  const user = await getCurrentUser();
  const season = await getActiveSeason();

  const matches = await prisma.match.findMany({
    where: { seasonId: season.id },
    orderBy: { kickoffAt: "asc" },
    include: {
      predictions: { where: { userId: user.id }, select: { id: true } },
    },
  });

  await connection();
  // eslint-disable-next-line react-hooks/purity -- il rule non riconosce connection() come guardia: sopra forza la valutazione a request time.
  const now = Date.now();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold tracking-tight text-inter-navy">
        Partite — {season.label}
      </h1>

      <ul className="flex flex-col gap-3">
        {matches.map((match) => {
          const locked = now >= match.predictionDeadlineAt.getTime();
          const hasPredicted = match.predictions.length > 0;
          const status = match.status === "FINISHED"
            ? "Conclusa"
            : locked
              ? "Pronostici chiusi"
              : hasPredicted
                ? "Pronosticato"
                : "Da pronosticare";
          const finished = match.status === "FINISHED";

          const homeName = match.isHome ? "Inter" : match.opponent;
          const awayName = match.isHome ? match.opponent : "Inter";

          return (
            <li key={match.id}>
              <Link
                href={`/matches/${match.id}`}
                className="group flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium tracking-wide text-zinc-400 uppercase">
                    {COMPETITION_LABELS[match.competition] ?? match.competition}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLES[status]}`}>
                    {status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-1 items-center gap-2">
                    <TeamBadge label={homeName} variant={match.isHome ? "inter" : "opponent"} />
                    <span className="truncate text-sm font-medium">{homeName}</span>
                  </div>

                  {finished ? (
                    <span className="px-3 text-lg font-bold text-inter-navy">
                      {match.homeScore} – {match.awayScore}
                    </span>
                  ) : (
                    <span className="px-3 text-xs font-semibold text-zinc-300">VS</span>
                  )}

                  <div className="flex flex-1 items-center justify-end gap-2">
                    <span className="truncate text-sm font-medium">{awayName}</span>
                    <TeamBadge label={awayName} variant={!match.isHome ? "inter" : "opponent"} />
                  </div>
                </div>

                <div className="text-xs text-zinc-400">
                  {match.kickoffAt.toLocaleString("it-IT", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </Link>
            </li>
          );
        })}
        {matches.length === 0 && (
          <li className="rounded-2xl bg-surface p-6 text-center text-sm text-zinc-500 shadow-card">
            Nessuna partita ancora in calendario.
          </li>
        )}
      </ul>
    </div>
  );
}
