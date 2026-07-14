"use client";

import { useState } from "react";

const inputClass =
  "rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none disabled:opacity-50";

// Tendina popolata dalla rosa Inter sincronizzata (vedi Player nello
// schema), con un'opzione "Altro" che passa a un campo di testo libero —
// necessario se la rosa non è ancora stata sincronizzata, o per un
// giocatore che l'ha lasciata dopo un pronostico già salvato con quel nome.
export function ScorerPlayerField({
  squad,
  initialName,
  disabled,
}: {
  squad: string[];
  initialName: string | null;
  disabled: boolean;
}) {
  const initialInSquad = !!initialName && squad.includes(initialName);
  const [manualMode, setManualMode] = useState(
    squad.length === 0 || (!!initialName && !initialInSquad),
  );

  if (manualMode) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="scorerPlayerName"
          defaultValue={initialName ?? ""}
          disabled={disabled}
          placeholder="Nome giocatore"
          className={inputClass}
        />
        {squad.length > 0 && (
          <button
            type="button"
            onClick={() => setManualMode(false)}
            className="text-xs text-heading underline"
          >
            scegli dalla rosa
          </button>
        )}
      </div>
    );
  }

  return (
    <select
      name="scorerPlayerName"
      disabled={disabled}
      defaultValue={initialInSquad ? initialName! : ""}
      onChange={(e) => {
        if (e.target.value === "__other__") setManualMode(true);
      }}
      className={inputClass}
    >
      <option value="" disabled>
        Seleziona…
      </option>
      {squad.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
      <option value="__other__">Altro (scrivi il nome)</option>
    </select>
  );
}
