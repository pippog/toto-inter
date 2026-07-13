import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export function AppShell({
  userName,
  isAdmin,
  logoutSlot,
  children,
}: {
  userName: string;
  isAdmin: boolean;
  logoutSlot: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar userName={userName} isAdmin={isAdmin} logoutSlot={logoutSlot} />
      <main className="flex-1 bg-white">{children}</main>
    </div>
  );
}
