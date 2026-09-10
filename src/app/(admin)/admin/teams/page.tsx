import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { CreateTeamForm } from "./create-team-form";
import { TeamRow } from "./team-row";

export default async function AdminTeamsPage() {
  await requireAdmin();

  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-heading">Gestione squadre</h1>
      <p className="text-sm text-zinc-500">
        Una squadra reale (es. Inter) è la precondizione per creare una lega — ogni lega segue una squadra sola.
      </p>

      <CreateTeamForm />

      <ul className="flex flex-col gap-2">
        {teams.map((t) => (
          <TeamRow key={t.id} team={t} />
        ))}
      </ul>
    </div>
  );
}
