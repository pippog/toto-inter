"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { ScorerPlayerField } from "@/components/scorer-player-field";
import { setManualResult } from "../../actions";

type MatchResultFields = {
  homeScore: number | null;
  awayScore: number | null;
  firstScorerKind: string | null;
  firstScorerPlayerName: string | null;
};

export function ResultForm({
  matchId,
  match,
  squad,
  opponent,
  isHome,
}: {
  matchId: string;
  match: MatchResultFields;
  squad: string[];
  opponent: string;
  isHome: boolean;
}) {
  const boundAction = setManualResult.bind(null, matchId);
  const [state, action, pending] = useActionState(boundAction, undefined);
  const [scorerKind, setScorerKind] = useState(
    match.firstScorerKind ?? "NONE",
  );

  const homeLabel = isHome ? "Inter" : opponent;
  const awayLabel = isHome ? opponent : "Inter";

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-2xl bg-surface shadow-card p-4"
    >
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          {homeLabel}
          <input
            type="number"
            name="homeScore"
            min={0}
            defaultValue={match.homeScore ?? 0}
            required
            className="w-16 rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
          />
        </label>
        <span className="pb-1.5">-</span>
        <label className="flex flex-col gap-1 text-sm">
          {awayLabel}
          <input
            type="number"
            name="awayScore"
            min={0}
            defaultValue={match.awayScore ?? 0}
            required
            className="w-16 rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
          />
        </label>
        <span className="pb-1.5 text-xs text-zinc-500">(risultato ai 90&apos;)</span>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm text-zinc-500">
          Primo marcatore dell&apos;Inter
        </legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="scorerKind"
            value="NONE"
            checked={scorerKind === "NONE"}
            onChange={() => setScorerKind("NONE")}
          />
          Nessun marcatore
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="scorerKind"
            value="OWN_GOAL"
            checked={scorerKind === "OWN_GOAL"}
            onChange={() => setScorerKind("OWN_GOAL")}
          />
          Autogol avversario a favore dell&apos;Inter
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="scorerKind"
            value="PLAYER_GOAL"
            checked={scorerKind === "PLAYER_GOAL"}
            onChange={() => setScorerKind("PLAYER_GOAL")}
          />
          Un giocatore dell&apos;Inter:
          <ScorerPlayerField
            squad={squad}
            initialName={match.firstScorerPlayerName}
            active={scorerKind === "PLAYER_GOAL"}
            onSelectPlayer={() => setScorerKind("PLAYER_GOAL")}
          />
        </label>
      </fieldset>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-accent-teal [animation:rise-in_0.3s_ease-out_both]">
          <Check className="size-4" />
          Risultato salvato e punteggi ricalcolati.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-inter-navy px-4 py-2.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-inter-navy-light hover:shadow-md active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : "Salva risultato e ricalcola punteggi"}
      </button>
    </form>
  );
}
