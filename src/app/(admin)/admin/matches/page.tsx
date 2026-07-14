import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { CreateMatchForm } from "./create-match-form";
import { CompetitionBadge } from "@/components/competition-badge";

export default async function AdminMatchesPage() {
  await requireAdmin();

  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: "desc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-heading">Gestione partite</h1>

      <CreateMatchForm />

      <ul className="flex flex-col gap-2">
        {matches.map((m) => (
          <li key={m.id}>
            <Link
              href={`/admin/matches/${m.id}/result`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-3 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <span className="flex items-center gap-3">
                <CompetitionBadge competition={m.competition} />
                <span>
                  Inter {m.isHome ? "-" : "@"} {m.opponent} —{" "}
                  {m.kickoffAt.toLocaleString("it-IT", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </span>
              <span className="text-sm text-zinc-500">
                {m.status} / {m.resultSource}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
