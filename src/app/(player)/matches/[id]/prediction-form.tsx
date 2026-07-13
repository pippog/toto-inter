"use client";

import { useActionState, useState } from "react";
import { ScorerPlayerField } from "@/components/scorer-player-field";
import { submitPrediction } from "./actions";

type Initial = {
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedScorerKind: string;
  predictedScorerPlayerName: string | null;
} | null;

export function PredictionForm({
  matchId,
  initial,
  squad,
  opponent,
  isHome,
}: {
  matchId: string;
  initial: Initial;
  squad: string[];
  opponent: string;
  isHome: boolean;
}) {
  const boundAction = submitPrediction.bind(null, matchId);
  const [state, action, pending] = useActionState(boundAction, undefined);
  const [scorerKind, setScorerKind] = useState(
    initial?.predictedScorerKind ?? "NONE",
  );

  const homeLabel = isHome ? "Inter" : opponent;
  const awayLabel = isHome ? opponent : "Inter";

  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl bg-surface shadow-card p-4">
      <h2 className="font-medium text-inter-navy">
        {initial ? "Modifica il tuo pronostico" : "Il tuo pronostico"}
      </h2>

      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          {homeLabel}
          <input
            type="number"
            name="homeScore"
            min={0}
            defaultValue={initial?.predictedHomeScore ?? 0}
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
            defaultValue={initial?.predictedAwayScore ?? 0}
            required
            className="w-16 rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
          />
        </label>
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
          Nessun marcatore (l&apos;Inter non segna)
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
            initialName={initial?.predictedScorerPlayerName ?? null}
            disabled={scorerKind !== "PLAYER_GOAL"}
          />
        </label>
      </fieldset>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-inter-navy px-4 py-2.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-inter-navy-light hover:shadow-md active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : "Salva pronostico"}
      </button>
    </form>
  );
}
