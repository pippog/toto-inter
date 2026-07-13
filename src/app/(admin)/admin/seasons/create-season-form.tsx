"use client";

import { useActionState } from "react";
import { createSeason } from "./actions";

export function CreateSeasonForm() {
  const [state, action, pending] = useActionState(createSeason, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded border border-black/10 p-4 dark:border-white/10"
    >
      <h2 className="font-medium">Nuova stagione</h2>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Diventa subito la stagione attiva: le partite e le classifiche future
        fanno riferimento a lei, e streak/classifica ripartono da zero.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Etichetta (es. 2027-28)
        <input
          name="label"
          required
          className="rounded border border-black/10 bg-transparent px-2 py-1 dark:border-white/10"
        />
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
      >
        {pending ? "Creazione…" : "Crea e attiva stagione"}
      </button>
    </form>
  );
}
