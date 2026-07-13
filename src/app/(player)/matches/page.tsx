import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser, getActiveSeason } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { LogoutButton } from "@/app/(auth)/logout-button";

const COMPETITION_LABELS: Record<string, string> = {
  SERIE_A: "Serie A",
  COPPA_ITALIA: "Coppa Italia",
  CHAMPIONS_LEAGUE: "Champions League",
  EUROPA_LEAGUE: "Europa League",
  FRIENDLY: "Amichevole",
  OTHER: "Altro",
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ciao, {user.name}</h1>
        <LogoutButton />
      </div>

      <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/leaderboard" className="underline">
          Classifica
        </Link>
      </div>

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
                className="flex items-center justify-between rounded border border-black/10 p-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              >
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {COMPETITION_LABELS[match.competition] ?? match.competition} —{" "}
                    {match.kickoffAt.toLocaleString("it-IT", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
                <span className="text-sm">{status}</span>
              </Link>
            </li>
          );
        })}
        {matches.length === 0 && (
          <li className="text-sm text-zinc-600 dark:text-zinc-400">
            Nessuna partita ancora in calendario.
          </li>
        )}
      </ul>
    </div>
  );
}
