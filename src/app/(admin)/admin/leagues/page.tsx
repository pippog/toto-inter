import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { CreateLeagueForm } from "./create-league-form";

export default async function AdminLeaguesPage() {
  await requireAdmin();

  const [leagues, teams] = await Promise.all([
    prisma.league.findMany({
      orderBy: { createdAt: "asc" },
      include: { team: true, _count: { select: { memberships: true } } },
    }),
    prisma.team.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-heading">Gestione leghe</h1>

      <CreateLeagueForm teams={teams} />

      <ul className="flex flex-col gap-2">
        {leagues.map((l) => (
          <li key={l.id}>
            <Link
              href={`/admin/leagues/${l.id}`}
              className="flex items-center justify-between rounded-2xl bg-surface shadow-card px-4 py-3 text-sm transition-colors hover:bg-[var(--sidebar-hover)]"
            >
              <div className="flex flex-col">
                <span className="font-medium text-heading">{l.name}</span>
                <span className="text-xs text-zinc-500">
                  {l.team.name} · /{l.slug}
                </span>
              </div>
              <span className="text-xs text-zinc-500">
                {l._count.memberships} membri
              </span>
            </Link>
          </li>
        ))}
        {leagues.length === 0 && (
          <li className="text-sm text-zinc-500">Nessuna lega ancora creata.</li>
        )}
      </ul>
    </div>
  );
}
