"use client";

import { useState } from "react";
import Link from "next/link";
import { CompetitionBadge } from "@/components/competition-badge";

type MatchRow = {
  id: string;
  competition: string;
  isHome: boolean;
  opponent: string;
  homeScore: number | null;
  awayScore: number | null;
  kickoffAt: Date;
  status: string;
  finished: boolean;
  todo: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  Conclusa: "bg-zinc-100 text-zinc-600",
  "Pronostici chiusi": "bg-zinc-100 text-zinc-600",
  Pronosticato: "bg-inter-navy-soft text-inter-navy",
  "Da pronosticare": "bg-inter-gold-soft text-inter-navy-dark",
};

function TeamBadge({ label, variant }: { label: string; variant: "inter" | "opponent" }) {
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        variant === "inter"
          ? "bg-gradient-to-br from-inter-navy to-inter-black text-white"
          : "bg-zinc-100 text-zinc-500"
      }`}
    >
      {variant === "inter" ? "IN" : label.slice(0, 2).toUpperCase()}
    </span>
  );
}

const TABS = [
  { key: "all", label: "Tutte" },
  { key: "todo", label: "Da pronosticare" },
  { key: "played", label: "Giocate" },
] as const;

export function MatchesList({ matches }: { matches: MatchRow[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");

  const filtered = matches.filter((m) => {
    if (tab === "todo") return m.todo;
    if (tab === "played") return m.finished;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-fit gap-1 rounded-xl bg-foreground/5 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.key ? "bg-surface text-heading shadow-sm" : "text-zinc-500 hover:text-heading"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {filtered.map((match) => {
          const homeName = match.isHome ? "Inter" : match.opponent;
          const awayName = match.isHome ? match.opponent : "Inter";

          return (
            <li key={match.id}>
              <Link
                href={`/matches/${match.id}`}
                className="group flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between text-xs">
                  <CompetitionBadge competition={match.competition} />
                  <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_STYLES[match.status]}`}>
                    {match.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-1 items-center gap-2">
                    <TeamBadge label={homeName} variant={match.isHome ? "inter" : "opponent"} />
                    <span className="truncate text-sm font-medium">{homeName}</span>
                  </div>

                  {match.finished ? (
                    <span className="px-3 text-lg font-bold text-heading">
                      {match.homeScore} – {match.awayScore}
                    </span>
                  ) : (
                    <span className="px-3 text-xs font-semibold text-zinc-300">VS</span>
                  )}

                  <div className="flex flex-1 items-center justify-end gap-2">
                    <span className="truncate text-sm font-medium">{awayName}</span>
                    <TeamBadge label={awayName} variant={!match.isHome ? "inter" : "opponent"} />
                  </div>
                </div>

                <div className="text-xs text-zinc-400">
                  {match.kickoffAt.toLocaleString("it-IT", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </Link>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="rounded-2xl bg-surface p-6 text-center text-sm text-zinc-500 shadow-card">
            Nessuna partita in questa categoria.
          </li>
        )}
      </ul>
    </div>
  );
}
