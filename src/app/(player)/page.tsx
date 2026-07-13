import Link from "next/link";
import { connection } from "next/server";
import { Trophy, CalendarDays, ArrowRight, Flame, Target, Hash } from "lucide-react";
import { getCurrentUser, getActiveSeason } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/avatar";

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

  const fullStandings = users
    .map((u) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      totalPoints: u.matchScores.reduce((sum, ms) => sum + Number(ms.totalPoints), 0),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const myRank = fullStandings.findIndex((s) => s.id === user.id) + 1;
  const myPoints = fullStandings.find((s) => s.id === user.id)?.totalPoints ?? 0;
  const standings = fullStandings.slice(0, 5);

  const streak = await prisma.playerStreakState.findUnique({
    where: { userId_seasonId: { userId: user.id, seasonId: season.id } },
  });

  await connection();
  const upcomingMatches = await prisma.match.findMany({
    where: { seasonId: season.id, kickoffAt: { gte: new Date() } },
    orderBy: { kickoffAt: "asc" },
    take: 4,
    include: {
      predictions: { where: { userId: user.id }, select: { id: true } },
    },
  });

  const stats = [
    { label: "Posizione", value: myRank > 0 ? `#${myRank}` : "—", icon: Hash },
    { label: "I tuoi punti", value: myPoints.toFixed(2), icon: Trophy },
    { label: "Streak risultato", value: streak?.currentResStreak ?? 0, icon: Target },
    { label: "Streak marcatore", value: streak?.currentMarcatoreStreak ?? 0, icon: Flame },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="relative overflow-hidden bg-gradient-to-br from-inter-navy via-inter-navy to-inter-black px-8 pb-14 pt-10">
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-inter-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 size-56 rounded-full bg-white/5 blur-3xl" />
        <p className="relative text-sm font-medium tracking-wide text-inter-gold-light">
          Stagione {season.label}
        </p>
        <h1 className="relative mt-1 text-4xl font-bold tracking-tight text-white">
          Ciao, {user.name}
        </h1>
        <p className="relative mt-2 max-w-lg text-sm text-white/70">
          Pronostica i risultati e il primo marcatore dell&apos;Inter prima di ogni partita, scala la classifica e mantieni la striscia.
        </p>
      </div>

      <div className="mx-auto -mt-10 grid w-full max-w-4xl grid-cols-2 gap-3 px-8 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-1 rounded-2xl bg-surface p-4 shadow-card"
          >
            <s.icon className="size-4 text-inter-gold" />
            <span className="text-xl font-bold text-inter-navy">{s.value}</span>
            <span className="text-xs text-zinc-500">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 px-8 md:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-inter-navy">
              <Trophy className="size-[18px]" />
              Classifica
            </h2>
            <Link href="/leaderboard" className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-inter-navy">
              Tutta la classifica <ArrowRight className="size-3" />
            </Link>
          </div>
          <ol className="flex flex-col gap-1.5">
            {standings.map((s, i) => (
              <li
                key={s.id}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                  s.id === user.id ? "bg-inter-navy/5" : "hover:bg-zinc-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-xs font-semibold ${
                      i === 0 ? "bg-inter-gold text-inter-navy-dark" : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <Avatar name={s.name} avatarUrl={s.avatarUrl} size={20} />
                  {s.name}
                </span>
                <span className="font-medium text-inter-navy">{s.totalPoints.toFixed(2)} pt</span>
              </li>
            ))}
            {standings.length === 0 && (
              <li className="text-sm text-zinc-500">Nessun punteggio ancora registrato.</li>
            )}
          </ol>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-inter-navy">
              <CalendarDays className="size-[18px]" />
              Prossime partite
            </h2>
            <Link href="/matches" className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-inter-navy">
              Tutte le partite <ArrowRight className="size-3" />
            </Link>
          </div>
          <ul className="flex flex-col gap-1.5">
            {upcomingMatches.map((match) => {
              const hasPredicted = match.predictions.length > 0;
              return (
                <li key={match.id}>
                  <Link
                    href={`/matches/${match.id}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors hover:bg-zinc-50"
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
