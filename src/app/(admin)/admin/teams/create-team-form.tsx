"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { createTeam } from "./actions";

export function CreateTeamForm() {
  const [state, action, pending] = useActionState(createTeam, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl bg-surface shadow-card p-4"
    >
      <h2 className="font-medium text-heading">Nuova squadra</h2>

      <label className="flex flex-col gap-1 text-sm">
        Nome
        <input
          name="name"
          required
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Id squadra su Highlightly
        <input
          name="externalRef"
          required
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Logo (URL, opzionale)
        <input
          name="logoUrl"
          type="url"
          placeholder="https://…"
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        />
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-accent-teal [animation:rise-in_0.3s_ease-out_both]">
          <Check className="size-4" />
          Squadra creata.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-inter-navy px-4 py-2.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-inter-navy-light hover:shadow-md active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Creazione…" : "Crea squadra"}
      </button>
    </form>
  );
}
