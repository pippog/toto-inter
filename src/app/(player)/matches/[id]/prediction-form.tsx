"use client";

import { useActionState, useEffect, useState } from "react";
import { Minus, Plus, Check } from "lucide-react";
import { ScorerPlayerField } from "@/components/scorer-player-field";
import { submitPrediction } from "./actions";

type Initial = {
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedScorerKind: string;
  predictedScorerPlayerName: string | null;
} | null;

function ScoreStepper({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <span className="text-sm font-medium text-zinc-500">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Diminuisci ${label}`}
          className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-inter-navy"
        >
          <Minus className="size-3.5" />
        </button>
        <input
          type="number"
          name={name}
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          required
          className="w-12 rounded-lg bg-transparent text-center text-2xl font-bold text-heading focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Aumenta ${label}`}
          className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-inter-navy"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

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
  const [homeScore, setHomeScore] = useState(initial?.predictedHomeScore ?? 0);
  const [awayScore, setAwayScore] = useState(initial?.predictedAwayScore ?? 0);
  const [scorerPlayerName, setScorerPlayerName] = useState(
    initial?.predictedScorerPlayerName ?? "",
  );

  // Ogni submit dell'azione fa scattare un requestFormReset() interno di
  // React, che ripristina i campi nativi del form DOPO che React li ha già
  // ridisegnati con i valori corretti: senza rimonto, select/input tornano
  // visivamente al valore di default anche se lo stato React (e il DB) sono
  // corretti. Cambiare "key" sul form forza dei nodi DOM nuovi, immuni al
  // reset residuo, appena l'azione si conclude (successo o errore).
  const [formVersion, setFormVersion] = useState(0);
  useEffect(() => {
    if (state !== undefined) setFormVersion((v) => v + 1);
  }, [state]);

  const homeLabel = isHome ? "Inter" : opponent;
  const awayLabel = isHome ? opponent : "Inter";

  const scorerOptions = [
    { value: "NONE", title: "Nessun marcatore", subtitle: "L'Inter non segna" },
    { value: "OWN_GOAL", title: "Autogol avversario", subtitle: "A favore dell'Inter" },
    { value: "PLAYER_GOAL", title: "Un giocatore dell'Inter", subtitle: null },
  ] as const;

  return (
    <form
      action={action}
      key={formVersion}
      className="flex flex-col gap-5 rounded-2xl bg-surface shadow-card p-5"
    >
      <h2 className="font-medium text-heading">
        {initial ? "Modifica il tuo pronostico" : "Il tuo pronostico"}
      </h2>

      <div className="flex items-center justify-center gap-4 rounded-xl bg-background/60 py-4">
        <ScoreStepper label={homeLabel} name="homeScore" value={homeScore} onChange={setHomeScore} />
        <span className="text-lg font-semibold text-zinc-300">–</span>
        <ScoreStepper label={awayLabel} name="awayScore" value={awayScore} onChange={setAwayScore} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm text-zinc-500">
          Primo marcatore dell&apos;Inter
        </legend>
        {scorerOptions.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer flex-col gap-2 rounded-xl border p-3 text-sm transition-colors ${
              scorerKind === option.value
                ? "border-inter-navy/30 bg-inter-navy/5"
                : "border-black/10 hover:border-black/20"
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="scorerKind"
                value={option.value}
                checked={scorerKind === option.value}
                onChange={() => setScorerKind(option.value)}
                className="accent-inter-navy"
              />
              <span className="flex flex-col">
                <span className="font-medium">{option.title}</span>
                {option.subtitle && <span className="text-xs text-zinc-500">{option.subtitle}</span>}
              </span>
            </span>
            {option.value === "PLAYER_GOAL" && (
              <div className="pl-6">
                <ScorerPlayerField
                  squad={squad}
                  value={scorerPlayerName}
                  onChange={setScorerPlayerName}
                  active={scorerKind === "PLAYER_GOAL"}
                  onSelectPlayer={() => setScorerKind("PLAYER_GOAL")}
                />
              </div>
            )}
          </label>
        ))}
      </fieldset>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-accent-teal [animation:rise-in_0.3s_ease-out_both]">
          <Check className="size-4" />
          Pronostico salvato.
        </p>
      )}

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
