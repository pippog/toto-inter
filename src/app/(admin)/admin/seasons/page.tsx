import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { CreateSeasonForm } from "./create-season-form";

export default async function AdminSeasonsPage() {
  await requireAdmin();

  const seasons = await prisma.season.findMany({
    orderBy: { label: "desc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Gestione stagioni</h1>

      <CreateSeasonForm />

      <ul className="flex flex-col gap-2">
        {seasons.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded border border-black/10 px-4 py-2 text-sm dark:border-white/10"
          >
            <span>{s.label}</span>
            {s.isActive && (
              <span className="rounded bg-foreground px-2 py-0.5 text-xs text-background">
                Attiva
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
