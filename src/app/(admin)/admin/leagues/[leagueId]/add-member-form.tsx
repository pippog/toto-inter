"use client";

import { useActionState } from "react";
import { addMember } from "./actions";

export function AddMemberForm({
  leagueId,
  candidates,
}: {
  leagueId: string;
  candidates: { id: string; name: string; email: string }[];
}) {
  const addMemberWithLeague = addMember.bind(null, leagueId);
  const [state, action, pending] = useActionState(addMemberWithLeague, undefined);

  if (candidates.length === 0) {
    return <p className="text-xs text-zinc-500">Tutti gli utenti sono già membri di questa lega.</p>;
  }

  return (
    <form action={action} className="flex items-end gap-2">
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Aggiungi membro
        <select
          name="userId"
          required
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        >
          {candidates.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-inter-navy px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-inter-navy-light disabled:opacity-50"
      >
        {pending ? "Aggiunta…" : "Aggiungi"}
      </button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
