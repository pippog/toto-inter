"use client";

import { useTransition } from "react";
import type { User } from "@/generated/prisma/client";
import { Avatar } from "@/components/avatar";
import { setUserRole, setUserStatus } from "./actions";

const STATUS_LABEL: Record<User["status"], string> = {
  INVITED: "Invitato",
  ACTIVE: "Attivo",
  DISABLED: "Disabilitato",
};

export function UserRow({ user, isSelf }: { user: User; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl bg-surface shadow-card px-3 py-2 text-sm">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} avatarUrl={user.avatarUrl} size={32} />
        <div className="flex flex-col">
          <span className="font-medium">
            {user.name}
            {isSelf && <span className="ml-2 text-xs text-zinc-500">(tu)</span>}
            {(user.firstName || user.lastName) && (
              <span className="ml-2 text-xs font-normal text-zinc-500">
                ({[user.firstName, user.lastName].filter(Boolean).join(" ")})
              </span>
            )}
          </span>
          <span className="text-xs text-zinc-500">
            {user.email} · {STATUS_LABEL[user.status]} ·{" "}
            {user.role === "ADMIN" ? "Admin" : "Giocatore"}
          </span>
        </div>
      </div>

      {!isSelf && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() =>
                setUserStatus(
                  user.id,
                  user.status === "DISABLED" ? "ACTIVE" : "DISABLED",
                ),
              )
            }
            className="rounded-lg border border-black/10 px-2 py-1 text-xs transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            {user.status === "DISABLED" ? "Riabilita" : "Disabilita"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() =>
                setUserRole(
                  user.id,
                  user.role === "ADMIN" ? "PLAYER" : "ADMIN",
                ),
              )
            }
            className="rounded-lg border border-black/10 px-2 py-1 text-xs transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            {user.role === "ADMIN" ? "Rimuovi admin" : "Rendi admin"}
          </button>
        </div>
      )}
    </li>
  );
}
