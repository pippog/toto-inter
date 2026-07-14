import { connection } from "next/server";
import { getCurrentUser, getSeason } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { MatchesList } from "./matches-list";
import { SeasonSelector } from "@/components/season-selector";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const user = await getCurrentUser();
  const { season: seasonParam } = await searchParams;
  const [season, seasons] = await Promise.all([
    getSeason(seasonParam),
    prisma.season.findMany({
      select: { id: true, label: true, isActive: true },
      orderBy: { label: "desc" },
    }),
  ]);

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

  const rows = matches.map((match) => {
    const locked = now >= match.predictionDeadlineAt.getTime();
    const hasPredicted = match.predictions.length > 0;
    const finished = match.status === "FINISHED";
    const status = finished
      ? "Conclusa"
      : locked
        ? "Pronostici chiusi"
        : hasPredicted
          ? "Pronosticato"
          : "Da pronosticare";

    return {
      id: match.id,
      competition: match.competition,
      isHome: match.isHome,
      opponent: match.opponent,
      opponentLogoUrl: match.opponentLogoUrl,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      kickoffAt: match.kickoffAt,
      status,
      finished,
      todo: !finished && !locked && !hasPredicted,
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-heading">
          Partite — {season.label}
        </h1>
        <SeasonSelector seasons={seasons} currentSeasonId={season.id} />
      </div>

      <MatchesList matches={rows} />
    </div>
  );
}
