"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useMobileNav } from "./mobile-nav-context";

type Crumb = { label: string; href?: string };

const EXACT_ROUTES: Record<string, Crumb[]> = {
  "/": [{ label: "Dashboard" }],
  "/matches": [{ label: "Partite" }],
  "/leaderboard": [{ label: "Classifica" }],
  "/regolamento": [{ label: "Regolamento" }],
  "/profile": [{ label: "Profilo" }],
  "/admin": [{ label: "Admin" }],
  "/admin/matches": [{ label: "Admin", href: "/admin" }, { label: "Partite" }],
  "/admin/users": [{ label: "Admin", href: "/admin" }, { label: "Utenti" }],
  "/admin/seasons": [{ label: "Admin", href: "/admin" }, { label: "Stagioni" }],
};

function breadcrumbFor(pathname: string): Crumb[] {
  if (EXACT_ROUTES[pathname]) return EXACT_ROUTES[pathname];
  if (pathname.startsWith("/matches/")) {
    return [{ label: "Partite", href: "/matches" }, { label: "Dettaglio partita" }];
  }
  if (pathname.startsWith("/admin/matches/")) {
    return [
      { label: "Admin", href: "/admin" },
      { label: "Partite", href: "/admin/matches" },
      { label: "Risultato" },
    ];
  }
  return [{ label: "Dashboard" }];
}

export function Topbar() {
  const pathname = usePathname();
  const { setOpen } = useMobileNav();
  const crumbs = breadcrumbFor(pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--glass-border)] bg-[var(--surface)] px-4 py-3 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Apri il menu"
          className="text-zinc-400 hover:text-heading md:hidden"
        >
          <Menu className="size-5" />
        </button>
        <nav className="flex items-center gap-1.5 text-sm">
          <span className="text-zinc-400">Home</span>
          {crumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-1.5">
              <span className="text-zinc-300">›</span>
              {crumb.href ? (
                <Link href={crumb.href} className="text-zinc-400 transition-colors hover:text-heading">
                  {crumb.label}
                </Link>
              ) : (
                <span className={i === crumbs.length - 1 ? "font-medium text-heading" : "text-zinc-400"}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>
      <ThemeToggle />
    </header>
  );
}
