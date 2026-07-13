"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  Trophy,
  User,
  ShieldCheck,
  Users,
  CalendarRange,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: ComponentType<{ className?: string }> };

const PLAYER_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/matches", label: "Partite", icon: CalendarDays },
  { href: "/leaderboard", label: "Classifica", icon: Trophy },
  { href: "/profile", label: "Profilo", icon: User },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/matches", label: "Partite", icon: ShieldCheck },
  { href: "/admin/users", label: "Utenti", icon: Users },
  { href: "/admin/seasons", label: "Stagioni", icon: CalendarRange },
];

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-inter-gold/15 text-inter-gold-light font-medium"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="size-[18px] shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function Sidebar({
  userName,
  isAdmin,
  logoutSlot,
}: {
  userName: string;
  isAdmin: boolean;
  logoutSlot: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("sidebar-collapsed");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lettura da localStorage disponibile solo lato client, non c'è modo di farlo nel lazy initializer senza mismatch di idratazione.
    if (stored === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Barra superiore mobile: solo hamburger + wordmark, sidebar vera è off-canvas */}
      <div className="flex items-center justify-between border-b border-black/10 bg-inter-navy px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Apri il menu"
          className="text-white"
        >
          <Menu className="size-6" />
        </button>
        <span className="font-semibold text-white">Toto-Inter</span>
        <span className="w-6" />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-inter-navy transition-all duration-200 ease-in-out md:sticky md:top-0 md:z-0 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-[72px]" : "md:w-60"} w-64`}
      >
        <div className="flex items-center justify-between px-4 py-5">
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight text-white">
              Toto<span className="text-inter-gold-light">-Inter</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Chiudi il menu"
            className="text-white/70 hover:text-white md:hidden"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Espandi il menu" : "Comprimi il menu"}
            className="hidden text-white/50 hover:text-white md:block"
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <ChevronsLeft className="size-4" />
            )}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {PLAYER_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              collapsed={collapsed}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}

          {isAdmin && (
            <>
              <div className={`mt-4 mb-1 px-3 text-xs font-semibold tracking-wider text-white/40 ${collapsed ? "text-center" : ""}`}>
                {collapsed ? "•" : "ADMIN"}
              </div>
              {ADMIN_NAV.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  collapsed={collapsed}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          {!collapsed && (
            <p className="mb-2 truncate px-3 text-xs text-white/50">{userName}</p>
          )}
          {logoutSlot}
        </div>
      </aside>
    </>
  );
}
