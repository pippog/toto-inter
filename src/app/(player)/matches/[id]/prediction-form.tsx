"use client";

import { useActionState, useState } from "react";
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
}: {
  matchId: string;
  initial: Initial;
}) {
  const boundAction = submitPrediction.bind(null, matchId);
  const [state, action, pending] = useActionState(boundAction, undefined);
  const [scorerKind, setScorerKind] = useState(
    initial?.predictedScorerKind ?? "NONE",
  );

  return (
    <form action={action} className="flex flex-col gap-4 rounded border border-black/10 p-4 dark:border-white/10">
      <h2 className="font-medium">
        {initial ? "Modifica il tuo pronostico" : "Il tuo pronostico"}
      </h2>

      <div className="flex items-center gap-2">
        <input
          type="number"
          name="homeScore"
          min={0}
          defaultValue={initial?.predictedHomeScore ?? 0}
          required
          className="w-16 rounded border border-black/10 bg-transparent px-2 py-1 dark:border-white/10"
        />
        <span>-</span>
        <input
          type="number"
          name="awayScore"
          min={0}
          defaultValue={initial?.predictedAwayScore ?? 0}
          required
          className="w-16 rounded border border-black/10 bg-transparent px-2 py-1 dark:border-white/10"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm text-zinc-600 dark:text-zinc-400">
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
          <input
            type="text"
            name="scorerPlayerName"
            defaultValue={initial?.predictedScorerPlayerName ?? ""}
            disabled={scorerKind !== "PLAYER_GOAL"}
            className="rounded border border-black/10 bg-transparent px-2 py-1 disabled:opacity-50 dark:border-white/10"
          />
        </label>
      </fieldset>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : "Salva pronostico"}
      </button>
    </form>
  );
}
