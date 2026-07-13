import { requireAdmin } from "@/lib/dal";

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col items-center gap-4 p-16">
      <h1 className="text-2xl font-semibold">Admin: {user.name}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Qui arriveranno gestione utenti, partite e risultati.
      </p>
    </div>
  );
}
