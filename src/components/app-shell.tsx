import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export function AppShell({
  userName,
  avatarUrl,
  isAdmin,
  logoutSlot,
  children,
}: {
  userName: string;
  avatarUrl?: string | null;
  isAdmin: boolean;
  logoutSlot: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar userName={userName} avatarUrl={avatarUrl} isAdmin={isAdmin} logoutSlot={logoutSlot} />
      <main className="flex-1 bg-white">{children}</main>
    </div>
  );
}
