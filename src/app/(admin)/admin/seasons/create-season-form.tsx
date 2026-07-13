"use client";

import { useActionState } from "react";
import { createSeason } from "./actions";

export function CreateSeasonForm() {
  const [state, action, pending] = useActionState(createSeason, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl bg-surface shadow-card p-4"
    >
      <h2 className="font-medium text-inter-navy">Nuova stagione</h2>
      <p className="text-xs text-zinc-500">
        Diventa subito la stagione attiva: le partite e le classifiche future
        fanno riferimento a lei, e streak/classifica ripartono da zero.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Etichetta (es. 2027-28)
        <input
          name="label"
          required
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        />
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-inter-navy px-4 py-2.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-inter-navy-light hover:shadow-md active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Creazione…" : "Crea e attiva stagione"}
      </button>
    </form>
  );
}
