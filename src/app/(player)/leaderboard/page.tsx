import { getActiveSeason } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/avatar";

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

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-inter-navy">Classifica — {season.label}</h1>
      <ol className="flex flex-col gap-2">
        {standings.map((s, i) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3"
          >
            <span className="flex items-center gap-3">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-sm font-semibold ${
                  i === 0 ? "bg-inter-gold text-inter-navy-dark" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {i + 1}
              </span>
              <Avatar name={s.name} avatarUrl={s.avatarUrl} size={28} />
              <span>
                {s.name}{" "}
                <span className="text-sm text-zinc-500">({s.played} partite)</span>
              </span>
            </span>
            <span className="font-semibold text-inter-navy">{s.totalPoints.toFixed(2)} pt</span>
          </li>
        ))}
        {standings.length === 0 && (
          <li className="text-sm text-zinc-500">Nessun punteggio ancora registrato.</li>
        )}
      </ol>
    </div>
  );
}
