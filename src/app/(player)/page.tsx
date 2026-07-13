import Link from "next/link";
import { connection } from "next/server";
import { Trophy, CalendarDays, ArrowRight } from "lucide-react";
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

export default async function HomePage() {
  const user = await getCurrentUser();
  const season = await getActiveSeason();

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    include: { matchScores: { where: { match: { seasonId: season.id } } } },
  });

  const standings = users
    .map((u) => ({
      id: u.id,
      name: u.name,
      totalPoints: u.matchScores.reduce((sum, ms) => sum + Number(ms.totalPoints), 0),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 5);

  await connection();
  const upcomingMatches = await prisma.match.findMany({
    where: { seasonId: season.id, kickoffAt: { gte: new Date() } },
    orderBy: { kickoffAt: "asc" },
    take: 4,
    include: {
      predictions: { where: { userId: user.id }, select: { id: true } },
    },
  });

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="bg-gradient-to-br from-inter-navy via-inter-navy to-inter-black px-8 py-10">
        <p className="text-sm font-medium text-inter-gold-light">Stagione {season.label}</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">Ciao, {user.name}</h1>
        <p className="mt-2 max-w-lg text-sm text-white/70">
          Pronostica i risultati e il primo marcatore dell&apos;Inter prima di ogni partita, scala la classifica e mantieni la striscia.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 px-8 md:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-xl border border-black/10 p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-inter-navy">
              <Trophy className="size-[18px]" />
              Classifica
            </h2>
            <Link href="/leaderboard" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-inter-navy">
              Tutta la classifica <ArrowRight className="size-3" />
            </Link>
          </div>
          <ol className="flex flex-col gap-2">
            {standings.map((s, i) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-xs font-semibold ${
                      i === 0 ? "bg-inter-gold text-inter-navy-dark" : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {s.name}
                </span>
                <span className="font-medium">{s.totalPoints.toFixed(2)} pt</span>
              </li>
            ))}
            {standings.length === 0 && (
              <li className="text-sm text-zinc-500">Nessun punteggio ancora registrato.</li>
            )}
          </ol>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-black/10 p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-inter-navy">
              <CalendarDays className="size-[18px]" />
              Prossime partite
            </h2>
            <Link href="/matches" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-inter-navy">
              Tutte le partite <ArrowRight className="size-3" />
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {upcomingMatches.map((match) => {
              const hasPredicted = match.predictions.length > 0;
              return (
                <li key={match.id}>
                  <Link
                    href={`/matches/${match.id}`}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm hover:bg-zinc-100"
                  >
                    <div>
                      <div className="font-medium">
                        Inter {match.isHome ? "-" : "@"} {match.opponent}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {COMPETITION_LABELS[match.competition] ?? match.competition} —{" "}
                        {match.kickoffAt.toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        hasPredicted
                          ? "bg-inter-navy/10 text-inter-navy"
                          : "bg-inter-gold/20 text-inter-navy-dark"
                      }`}
                    >
                      {hasPredicted ? "Pronosticato" : "Da pronosticare"}
                    </span>
                  </Link>
                </li>
              );
            })}
            {upcomingMatches.length === 0 && (
              <li className="text-sm text-zinc-500">Nessuna partita in calendario.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
