import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { CreateMatchForm } from "./create-match-form";

export default async function AdminMatchesPage() {
  await requireAdmin();

  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: "desc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-inter-navy">Gestione partite</h1>

      <CreateMatchForm />

      <ul className="flex flex-col gap-2">
        {matches.map((m) => (
          <li key={m.id}>
            <Link
              href={`/admin/matches/${m.id}/result`}
              className="flex items-center justify-between rounded-xl border border-black/10 p-3 transition-colors hover:border-inter-navy/30 hover:bg-zinc-50"
            >
              <span>
                Inter {m.isHome ? "-" : "@"} {m.opponent} —{" "}
                {m.kickoffAt.toLocaleString("it-IT", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
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
