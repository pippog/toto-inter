import { signOut } from "@/auth";

export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="rounded border border-black/10 px-4 py-2 text-sm dark:border-white/10"
      >
        Esci
      </button>
    </form>
  );
}
