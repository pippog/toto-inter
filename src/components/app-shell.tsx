import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNavProvider } from "./mobile-nav-context";

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
    <MobileNavProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar userName={userName} avatarUrl={avatarUrl} isAdmin={isAdmin} logoutSlot={logoutSlot} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </MobileNavProvider>
  );
}
