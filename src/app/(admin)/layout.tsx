import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/dal";
import { AppShell } from "@/components/app-shell";
import { LogoutButton } from "@/app/(auth)/logout-button";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <AppShell
      userName={user.name}
      avatarUrl={user.avatarUrl}
      isAdmin={user.role === "ADMIN"}
      logoutSlot={<LogoutButton />}
    >
      {children}
    </AppShell>
  );
}
