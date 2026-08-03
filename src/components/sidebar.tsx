"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  Trophy,
  User,
  ShieldCheck,
  Users,
  CalendarRange,
  BookOpen,
  X,
  ChevronsLeft,
  Download,
  Share,
} from "lucide-react";
import { Avatar } from "./avatar";
import { useMobileNav } from "./mobile-nav-context";

// Non standard nel DOM lib di TypeScript: evento specifico Chromium/Edge che
// permette di triggerare l'install prompt nativo da un click utente.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type NavItem = { href: string; label: string; icon: ComponentType<{ className?: string }> };

const PLAYER_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/matches", label: "Partite", icon: CalendarDays },
  { href: "/leaderboard", label: "Classifica", icon: Trophy },
  { href: "/regolamento", label: "Regolamento", icon: BookOpen },
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
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
        active
          ? "bg-gradient-to-r from-inter-gold/15 via-[var(--sidebar-hover)] to-transparent font-medium text-[var(--sidebar-text)]"
          : "text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
      }`}
    >
      <span
        className={`absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-inter-gold transition-all duration-150 ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-30"
        }`}
      />
      <Icon className={`size-[18px] shrink-0 ${active ? "text-inter-gold" : ""}`} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

function InstallAppButton({ collapsed }: { collapsed: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lettura di matchMedia/userAgent disponibile solo lato client, non c'è modo di farlo nel lazy initializer senza mismatch di idratazione.
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window));

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferredPrompt(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isStandalone || (!deferredPrompt && !isIOS)) return null;

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    setShowIosHelp((v) => !v);
  }

  return (
    <div className="px-3 py-1">
      <button
        type="button"
        onClick={handleClick}
        title={collapsed ? "Installa l'app" : undefined}
        className="group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--sidebar-text-muted)] transition-all duration-150 hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
      >
        <Download className="size-[18px] shrink-0" />
        {!collapsed && <span>Installa l&apos;app</span>}
      </button>

      {showIosHelp && !collapsed && (
        <div className="mt-1 rounded-xl bg-[var(--sidebar-panel)] p-3 text-xs text-[var(--sidebar-text-muted)]">
          <p className="flex items-center gap-1.5">
            Tocca <Share className="size-3.5 shrink-0" /> e poi &quot;Aggiungi alla schermata Home&quot;.
          </p>
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  userName,
  avatarUrl,
  isAdmin,
  logoutSlot,
}: {
  userName: string;
  avatarUrl?: string | null;
  isAdmin: boolean;
  logoutSlot: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { open: mobileOpen, setOpen: setMobileOpen } = useMobileNav();

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
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar-pinstripe fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-[var(--sidebar-border)] bg-gradient-to-b from-[var(--sidebar-from)] via-[var(--sidebar-via)] to-[var(--sidebar-to)] shadow-card-hover backdrop-blur-xl transition-all duration-200 ease-in-out md:sticky md:top-0 md:z-0 md:h-screen md:translate-x-0 md:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-[72px]" : "md:w-64"} w-72`}
      >
        <div className={`flex items-center px-4 py-6 ${collapsed ? "justify-center" : "justify-between"}`}>
          <button
            type="button"
            onClick={() => collapsed && setCollapsed(false)}
            aria-label={collapsed ? "Espandi il menu" : undefined}
            className="flex items-center gap-2.5"
          >
            <Image
              src="/inter-logo.png"
              alt="Inter"
              width={32}
              height={32}
              className="size-8 shrink-0 rounded-lg bg-white shadow-sm"
            />
            {!collapsed && (
              <span className="text-lg font-semibold tracking-tight text-[var(--sidebar-text)]">
                il<span className="text-inter-gold">Giochino</span>
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Chiudi il menu"
            className="text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] md:hidden"
          >
            <X className="size-5" />
          </button>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Comprimi il menu"
              className="hidden text-[var(--sidebar-text-muted)] transition-colors hover:text-[var(--sidebar-text)] md:block"
            >
              <ChevronsLeft className="size-4" />
            </button>
          )}
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
              <div className={`mt-6 mb-2 px-3 ${collapsed ? "flex justify-center" : ""}`}>
                {collapsed ? (
                  <span className="block h-px w-6 bg-[var(--sidebar-divider)]" />
                ) : (
                  <span className="inline-flex items-center rounded-full bg-[var(--sidebar-divider)] px-2.5 py-1 text-[10px] font-semibold tracking-widest text-[var(--sidebar-text-muted)]">
                    ADMIN
                  </span>
                )}
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

        <InstallAppButton collapsed={collapsed} />

        <div className="mx-3 mb-3 rounded-xl bg-[var(--sidebar-panel)] p-2">
          {!collapsed && (
            <div className="mb-1 flex items-center gap-2 px-1 py-1">
              <Avatar name={userName} avatarUrl={avatarUrl} size={26} />
              <p className="truncate text-xs font-medium text-[var(--sidebar-text-muted)]">{userName}</p>
            </div>
          )}
          {logoutSlot}
        </div>
      </aside>
    </>
  );
}
