import { Crown } from "lucide-react";
import { getActiveSeason } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/avatar";

const PODIUM_STYLE = [
  { order: "md:order-2", height: "h-28", ring: "ring-inter-gold", badge: "bg-inter-gold text-inter-navy-dark" },
  { order: "md:order-1", height: "h-20", ring: "ring-zinc-300", badge: "bg-zinc-300 text-zinc-700" },
  { order: "md:order-3", height: "h-16", ring: "ring-amber-600", badge: "bg-amber-600 text-white" },
];

export default async function LeaderboardPage() {
  const season = await getActiveSeason();

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    include: {
      matchScores: {
        where: { match: { seasonId: season.id } },
      },
    },
  });

  const standings = users
    .map((u) => {
      const totalPoints = u.matchScores.reduce(
        (sum, ms) => sum + Number(ms.totalPoints),
        0,
      );
      return {
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        totalPoints,
        played: u.matchScores.length,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const top3 = standings.slice(0, 3);
  const rest = standings.slice(3);
  const leaderPoints = standings[0]?.totalPoints || 1;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 p-8">
      <h1 className="text-2xl font-bold tracking-tight text-heading">
        Classifica — {season.label}
      </h1>

      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4 md:gap-6">
          {top3.map((s, i) => (
            <div
              key={s.id}
              className={`flex flex-col items-center gap-2 ${PODIUM_STYLE[i].order}`}
            >
              {i === 0 && <Crown className="size-5 text-inter-gold" />}
              <div className={`rounded-full ring-2 ${PODIUM_STYLE[i].ring}`}>
                <Avatar name={s.name} avatarUrl={s.avatarUrl} size={i === 0 ? 56 : 44} />
              </div>
              <span className="max-w-20 truncate text-sm font-semibold text-heading">
                {s.name}
              </span>
              <span className="text-xs text-zinc-500">{s.totalPoints.toFixed(2)} pt</span>
              <div
                className={`flex w-16 items-start justify-center rounded-t-xl pt-1 text-sm font-bold shadow-card ${PODIUM_STYLE[i].height} ${PODIUM_STYLE[i].badge}`}
              >
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <ol className="flex flex-col gap-1.5">
        {rest.map((s, i) => (
          <li
            key={s.id}
            className="flex flex-col gap-1.5 rounded-xl bg-surface px-4 py-3 shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                  {i + 4}
                </span>
                <Avatar name={s.name} avatarUrl={s.avatarUrl} size={26} />
                <span className="text-sm">
                  {s.name}{" "}
                  <span className="text-xs text-zinc-500">({s.played} partite)</span>
                </span>
              </span>
              <span className="text-sm font-semibold text-heading">
                {s.totalPoints.toFixed(2)} pt
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-inter-navy/60"
                style={{ width: `${Math.max(4, (s.totalPoints / leaderPoints) * 100)}%` }}
              />
            </div>
          </li>
        ))}
        {standings.length === 0 && (
          <li className="text-sm text-zinc-500">Nessun punteggio ancora registrato.</li>
        )}
      </ol>
    </div>
  );
}
