"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { createLeague } from "./actions";

export function CreateLeagueForm({ teams }: { teams: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createLeague, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl bg-surface shadow-card p-4"
    >
      <h2 className="font-medium text-heading">Nuova lega</h2>

      <label className="flex flex-col gap-1 text-sm">
        Nome
        <input
          name="name"
          required
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Squadra seguita
        <select
          name="teamId"
          required
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-zinc-500">
        Diventerai automaticamente OWNER della nuova lega.
      </p>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-accent-teal [animation:rise-in_0.3s_ease-out_both]">
          <Check className="size-4" />
          Lega creata.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || teams.length === 0}
        className="rounded-xl bg-inter-navy px-4 py-2.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-inter-navy-light hover:shadow-md active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Creazione…" : "Crea lega"}
      </button>
      {teams.length === 0 && (
        <p className="text-xs text-red-600">Crea prima una squadra in /admin/teams.</p>
      )}
    </form>
  );
}
