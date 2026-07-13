import Link from "next/link";
import { getActiveSeason } from "@/lib/dal";
import { prisma } from "@/lib/db";

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
      return { id: u.id, name: u.name, totalPoints, played: u.matchScores.length };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Classifica — {season.label}</h1>
        <Link href="/matches" className="text-sm underline">
          Partite
        </Link>
      </div>
      <ol className="flex flex-col gap-2">
        {standings.map((s, i) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded border border-black/10 px-4 py-2 dark:border-white/10"
          >
            <span>
              {i + 1}. {s.name}{" "}
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                ({s.played} partite)
              </span>
            </span>
            <span className="font-semibold">{s.totalPoints.toFixed(2)} pt</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
