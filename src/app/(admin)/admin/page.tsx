import Link from "next/link";
import { requireAdmin } from "@/lib/dal";

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col items-center gap-4 p-16">
      <h1 className="text-2xl font-semibold">Admin: {user.name}</h1>
      <Link href="/admin/matches" className="underline">
        Gestione partite e risultati
      </Link>
      <Link href="/admin/users" className="underline">
        Gestione utenti
      </Link>
      <Link href="/admin/seasons" className="underline">
        Gestione stagioni
      </Link>
    </div>
  );
}
