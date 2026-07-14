import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { ResultForm } from "./result-form";

export default async function MatchResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) notFound();

  const squad = (
    await prisma.player.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { name: true },
    })
  ).map((p) => p.name);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold text-heading">
        Risultato — Inter {match.isHome ? "-" : "@"} {match.opponent}
      </h1>
      <p className="text-sm text-zinc-500">
        Fonte attuale: {match.resultSource} — Stato: {match.status}
      </p>
      <ResultForm
        matchId={id}
        match={match}
        squad={squad}
        opponent={match.opponent}
        isHome={match.isHome}
      />
    </div>
  );
}
