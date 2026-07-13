"use client";

import { useActionState } from "react";
import { createMatch } from "./actions";

const COMPETITIONS = [
  ["SERIE_A", "Serie A"],
  ["COPPA_ITALIA", "Coppa Italia"],
  ["CHAMPIONS_LEAGUE", "Champions League"],
  ["EUROPA_LEAGUE", "Europa League"],
  ["FRIENDLY", "Amichevole"],
  ["OTHER", "Altro"],
] as const;

export function CreateMatchForm() {
  const [state, action, pending] = useActionState(createMatch, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded border border-black/10 p-4 dark:border-white/10"
    >
      <h2 className="font-medium">Nuova partita</h2>

      <label className="flex flex-col gap-1 text-sm">
        Avversario
        <input
          name="opponent"
          required
          className="rounded border border-black/10 bg-transparent px-2 py-1 dark:border-white/10"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isHome" defaultChecked />
        Inter in casa
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Competizione
        <select
          name="competition"
          className="rounded border border-black/10 bg-transparent px-2 py-1 dark:border-white/10"
        >
          {COMPETITIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Calcio d&apos;inizio
        <input
          type="datetime-local"
          name="kickoffAt"
          required
          className="rounded border border-black/10 bg-transparent px-2 py-1 dark:border-white/10"
        />
      </label>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Il termine per i pronostici verrà impostato automaticamente a 5
        minuti prima del calcio d&apos;inizio.
      </p>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
      >
        {pending ? "Creazione…" : "Crea partita"}
      </button>
    </form>
  );
}
