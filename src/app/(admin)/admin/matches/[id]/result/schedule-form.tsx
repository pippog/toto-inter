"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateMatchSchedule } from "../../actions";
import { toItalianDateTimeLocalValue } from "@/lib/italianTime";

export function ScheduleForm({ matchId, kickoffAt }: { matchId: string; kickoffAt: Date }) {
  const boundAction = updateMatchSchedule.bind(null, matchId);
  const [state, action, pending] = useActionState(boundAction, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl bg-surface shadow-card p-4"
    >
      <h2 className="font-medium text-heading">Data e ora (italiane)</h2>
      <label className="flex flex-col gap-1 text-sm">
        Calcio d&apos;inizio
        <input
          type="datetime-local"
          name="kickoffAt"
          defaultValue={toItalianDateTimeLocalValue(kickoffAt)}
          required
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        />
      </label>
      <p className="text-xs text-zinc-500">
        Il termine per i pronostici si aggiorna automaticamente a 5 minuti prima.
      </p>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-accent-teal [animation:rise-in_0.3s_ease-out_both]">
          <Check className="size-4" />
          Data e ora aggiornate.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-inter-navy px-4 py-2.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-inter-navy-light hover:shadow-md active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : "Salva data e ora"}
      </button>
    </form>
  );
}
