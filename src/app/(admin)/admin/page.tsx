import { requireAdmin } from "@/lib/dal";

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 p-8">
      <h1 className="text-2xl font-semibold text-heading">Admin: {user.name}</h1>
      <p className="text-sm text-zinc-500">
        Usa il menu a sinistra per gestire partite, utenti e stagioni.
      </p>
    </div>
  );
}
