"use client";

import { useTransition } from "react";
import type { Team } from "@/generated/prisma/client";
import { setTeamActive } from "./actions";

export function TeamRow({ team }: { team: Team }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl bg-surface shadow-card px-3 py-2 text-sm">
      <div className="flex items-center gap-3">
        {team.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- logo esterno, dominio non noto in anticipo, coerente con team-badge.tsx
          <img src={team.logoUrl} alt="" className="size-8 rounded-full bg-white object-contain shadow-sm" />
        )}
        <div className="flex flex-col">
          <span className="font-medium">{team.name}</span>
          <span className="text-xs text-zinc-500">
            id Highlightly: {team.externalRef} · {team.active ? "Attiva" : "Disattivata"}
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => setTeamActive(team.id, !team.active))}
        className="rounded-lg border border-black/10 px-2 py-1 text-xs transition-colors hover:bg-zinc-50 disabled:opacity-50"
      >
        {team.active ? "Disattiva" : "Riattiva"}
      </button>
    </li>
  );
}
