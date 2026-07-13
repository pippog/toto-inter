import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { InviteUserForm } from "./invite-user-form";
import { UserRow } from "./user-row";

export default async function AdminUsersPage() {
  const currentAdmin = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Gestione utenti</h1>

      <InviteUserForm />

      <ul className="flex flex-col gap-2">
        {users.map((u) => (
          <UserRow key={u.id} user={u} isSelf={u.id === currentAdmin.id} />
        ))}
      </ul>
    </div>
  );
}
