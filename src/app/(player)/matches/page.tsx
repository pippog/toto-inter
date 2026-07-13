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
      <h1 className="text-2xl font-semibold text-inter-navy">Partite — {season.label}</h1>

      <ul className="flex flex-col gap-3">
        {matches.map((match) => {
          const locked = now >= match.predictionDeadlineAt.getTime();
          const hasPredicted = match.predictions.length > 0;
          const label = `Inter ${match.isHome ? "-" : "@"} ${match.opponent}`;
          const status = match.status === "FINISHED"
            ? "Conclusa"
            : locked
              ? "Pronostici chiusi"
              : hasPredicted
                ? "Pronosticato"
                : "Da pronosticare";

          return (
            <li key={match.id}>
              <Link
                href={`/matches/${match.id}`}
                className="flex items-center justify-between rounded-xl border border-black/10 p-4 transition-colors hover:border-inter-navy/30 hover:bg-zinc-50"
              >
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-zinc-500">
                    {COMPETITION_LABELS[match.competition] ?? match.competition} —{" "}
                    {match.kickoffAt.toLocaleString("it-IT", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
                  {status}
                </span>
              </Link>
            </li>
          );
        })}
        {matches.length === 0 && (
          <li className="text-sm text-zinc-500">Nessuna partita ancora in calendario.</li>
        )}
      </ul>
    </div>
  );
}
