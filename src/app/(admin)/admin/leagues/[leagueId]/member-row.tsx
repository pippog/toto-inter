"use client";

import { useTransition } from "react";
import { Avatar } from "@/components/avatar";
import type { LeagueRole } from "@/generated/prisma/enums";
import { setMemberRole, removeMember } from "./actions";

const ROLE_LABEL: Record<LeagueRole, string> = {
  MEMBER: "Membro",
  MODERATOR: "Moderatore",
  OWNER: "Owner",
};

export function MemberRow({
  leagueId,
  userId,
  name,
  avatarUrl,
  email,
  role,
  isLastOwner,
  canManage,
}: {
  leagueId: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  email: string;
  role: LeagueRole;
  isLastOwner: boolean;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl bg-surface shadow-card px-3 py-2 text-sm">
      <div className="flex items-center gap-3">
        <Avatar name={name} avatarUrl={avatarUrl} size={32} />
        <div className="flex flex-col">
          <span className="font-medium">{name}</span>
          <span className="text-xs text-zinc-500">{email}</span>
        </div>
      </div>

      {canManage ? (
        <div className="flex items-center gap-2">
          <select
            value={role}
            disabled={isPending || (isLastOwner && role === "OWNER")}
            onChange={(e) =>
              startTransition(() =>
                setMemberRole(leagueId, userId, e.target.value as LeagueRole),
              )
            }
            className="rounded-lg border border-black/10 bg-transparent px-2 py-1 text-xs focus:border-inter-navy focus:outline-none"
          >
            {(Object.keys(ROLE_LABEL) as LeagueRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isPending || isLastOwner}
            title={isLastOwner ? "Non puoi rimuovere l'unico OWNER della lega" : undefined}
            onClick={() => startTransition(() => removeMember(leagueId, userId))}
            className="rounded-lg border border-black/10 px-2 py-1 text-xs transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            Rimuovi
          </button>
        </div>
      ) : (
        <span className="text-xs text-zinc-500">{ROLE_LABEL[role]}</span>
      )}
    </li>
  );
}
