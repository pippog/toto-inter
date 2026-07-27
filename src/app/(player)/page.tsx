import Link from "next/link";
import { connection } from "next/server";
import { Trophy, CalendarDays, ArrowRight, Flame, Target, Hash, TrendingUp, History } from "lucide-react";
import { getCurrentUser, getActiveSeason, getVisiblePredictions } from "@/lib/dal";
import { LiveMatchCard } from "@/components/live-match-card";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/avatar";
import { StatTile } from "@/components/stat-tile";
import { EmptyState } from "@/components/empty-state";
import { Timeline, TimelineItem } from "@/components/timeline";
import { PointsChart } from "@/components/points-chart";
import { competitionLabel } from "@/lib/competition";
import { formatItalianDateTime } from "@/lib/italianTime";
import { StaggerList, StaggerItem } from "@/components/stagger-list";
import { AnimatedNumber } from "@/components/animated-number";

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
  const liveMatches = await prisma.match.findMany({
    where: { seasonId: season.id, kickoffAt: { lte: new Date() }, status: { not: "FINISHED" } },
    orderBy: { kickoffAt: "asc" },
  });
  const livePredictions = await Promise.all(
    liveMatches.map((match) => getVisiblePredictions(match.id)),
  );

  const upcomingMatches = await prisma.match.findMany({
    where: { seasonId: season.id, kickoffAt: { gte: new Date() } },
    orderBy: { kickoffAt: "asc" },
    take: 4,
    include: {
      predictions: { where: { userId: user.id }, select: { id: true } },
    },
  });

  const predictedUpcoming = upcomingMatches.filter((m) => m.predictions.length > 0).length;
  const matchdayCompletion =
    upcomingMatches.length > 0 ? Math.round((predictedUpcoming / upcomingMatches.length) * 100) : 0;

  const myMatchScores = await prisma.matchScore.findMany({
    where: { userId: user.id, match: { seasonId: season.id } },
    include: { match: true },
    orderBy: { match: { kickoffAt: "asc" } },
  });

  const chartData = myMatchScores.reduce<{ label: string; points: number }[]>((acc, ms) => {
    const previousTotal = acc.length > 0 ? acc[acc.length - 1].points : 0;
    acc.push({
      label: ms.match.opponent.slice(0, 3).toUpperCase(),
      points: previousTotal + Number(ms.totalPoints),
    });
    return acc;
  }, []);

  const recentMatches = [...myMatchScores].reverse().slice(0, 4);

  const stats: {
    label: string;
    value: string | number;
    icon: typeof Hash;
    accent: "gold" | "navy" | "teal" | "amber";
    decimals?: number;
    progress?: number;
  }[] = [
    { label: "Posizione", value: myRank > 0 ? `#${myRank}` : "—", icon: Hash, accent: "gold" },
    { label: "I tuoi punti", value: myPoints, decimals: 2, icon: Trophy, accent: "navy" },
    {
      label: "Streak risultato",
      value: streak?.currentResStreak ?? 0,
      icon: Target,
      accent: "teal",
      progress: Math.min(100, ((streak?.currentResStreak ?? 0) / 4) * 100),
    },
    {
      label: "Streak marcatore",
      value: streak?.currentMarcatoreStreak ?? 0,
      icon: Flame,
      accent: "amber",
      progress: Math.min(100, ((streak?.currentMarcatoreStreak ?? 0) / 4) * 100),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 pb-12 md:p-8">
      <div className="sidebar-pinstripe relative overflow-hidden rounded-3xl border border-[var(--sidebar-border)] bg-gradient-to-br from-[var(--sidebar-from)] via-[var(--sidebar-via)] to-[var(--sidebar-to)] px-6 py-8 shadow-card-hover md:px-10 md:py-10">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-inter-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 size-40 rounded-full bg-[var(--sidebar-hover)] blur-3xl" />
        <p className="relative text-sm font-medium tracking-wide text-inter-gold">
          Stagione {season.label}
        </p>
        <h1 className="relative mt-1 text-3xl font-bold tracking-tight text-[var(--sidebar-text)] md:text-4xl">
          Ciao, {user.name}
        </h1>
        <p className="relative mt-2 max-w-lg text-sm text-[var(--sidebar-text-muted)]">
          Pronostica i risultati e il primo marcatore dell&apos;Inter prima di ogni partita, scala la classifica e mantieni la striscia.
        </p>

        {upcomingMatches.length > 0 && (
          <div className="relative mt-6 max-w-xs">
            <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--sidebar-text-muted)]">
              <span>Pronostici prossime partite</span>
              <span className="font-medium text-inter-gold">
                {predictedUpcoming}/{upcomingMatches.length}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--sidebar-divider)]">
              <div
                className="h-full rounded-full bg-inter-gold"
                style={{ width: `${Math.max(4, matchdayCompletion)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {liveMatches.length > 0 && (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          {liveMatches.map((match, i) => (
            <LiveMatchCard key={match.id} match={match} predictions={livePredictions[i]} />
          ))}
        </div>
      )}

      <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <StatTile
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
            accent={s.accent}
            progress={s.progress}
            decimals={s.decimals}
            suffix={typeof s.value === "number" && s.decimals ? " pt" : ""}
          />
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-heading">
              <Trophy className="size-[18px]" />
              Classifica
            </h2>
            <Link href="/leaderboard" className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-heading">
              Tutta la classifica <ArrowRight className="size-3" />
            </Link>
          </div>
          <StaggerList as="ol" className="flex flex-col gap-1.5">
            {standings.map((s, i) => (
              <StaggerItem
                as="li"
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
                <span className="font-medium text-heading">
                  <AnimatedNumber value={s.totalPoints} decimals={2} suffix=" pt" />
                </span>
              </StaggerItem>
            ))}
            {standings.length === 0 && (
              <li>
                <EmptyState icon={Trophy} message="Nessun punteggio ancora registrato." compact />
              </li>
            )}
          </StaggerList>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-heading">
              <CalendarDays className="size-[18px]" />
              Prossime partite
            </h2>
            <Link href="/matches" className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-heading">
              Tutte le partite <ArrowRight className="size-3" />
            </Link>
          </div>
          <StaggerList as="ul" className="flex flex-col gap-1.5">
            {upcomingMatches.map((match) => {
              const hasPredicted = match.predictions.length > 0;
              return (
                <StaggerItem as="li" key={match.id}>
                  <Link
                    href={`/matches/${match.id}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors hover:bg-zinc-50"
                  >
                    <div>
                      <div className="font-medium">
                        Inter {match.isHome ? "-" : "@"} {match.opponent}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {competitionLabel(match.competition)} —{" "}
                        {formatItalianDateTime(match.kickoffAt)}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        hasPredicted
                          ? "bg-inter-navy-soft text-inter-navy"
                          : "bg-inter-gold-soft text-inter-navy-dark"
                      }`}
                    >
                      {hasPredicted ? "Pronosticato" : "Da pronosticare"}
                    </span>
                  </Link>
                </StaggerItem>
              );
            })}
            {upcomingMatches.length === 0 && (
              <li>
                <EmptyState icon={CalendarDays} message="Nessuna partita in calendario." compact />
              </li>
            )}
          </StaggerList>
        </section>
      </div>

      {chartData.length > 0 && (
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-2xl bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-semibold text-heading">
            <TrendingUp className="size-[18px]" />
            Andamento punti
          </h2>
          <PointsChart data={chartData} />
        </section>
      )}

      <section className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-2xl bg-surface p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-semibold text-heading">
          <History className="size-[18px]" />
          Ultime partite giocate
        </h2>
        {recentMatches.length > 0 ? (
          <Timeline>
            {recentMatches.map((ms, i) => (
              <TimelineItem
                key={ms.id}
                last={i === recentMatches.length - 1}
                tone={ms.resCorrect || ms.marcatoreCorrect ? "success" : "muted"}
                title={
                  <Link href={`/matches/${ms.matchId}`} className="hover:underline">
                    Inter {ms.match.isHome ? "-" : "@"} {ms.match.opponent}
                  </Link>
                }
                subtitle={`${ms.match.homeScore}-${ms.match.awayScore} — ${competitionLabel(ms.match.competition)}`}
                trailing={
                  <span className="font-semibold text-heading">
                    <AnimatedNumber value={Number(ms.totalPoints)} decimals={2} suffix=" pt" />
                  </span>
                }
              />
            ))}
          </Timeline>
        ) : (
          <EmptyState icon={History} message="Nessuna partita ancora giocata questa stagione." compact />
        )}
      </section>
    </div>
  );
}
