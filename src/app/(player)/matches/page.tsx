import { getCurrentUser } from "@/lib/dal";
import { LogoutButton } from "@/app/(auth)/logout-button";

export default async function MatchesPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col items-center gap-4 p-16">
      <h1 className="text-2xl font-semibold">Ciao, {user.name}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Ruolo: {user.role} — qui arriverà l&apos;elenco delle partite da pronosticare.
      </p>
      <LogoutButton />
    </div>
  );
}
