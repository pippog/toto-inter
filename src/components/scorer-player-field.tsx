"use client";

import { useState } from "react";

const inputClass =
  "rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none";

// Tendina popolata dalla rosa Inter sincronizzata (vedi Player nello
// schema), con un'opzione "Altro" che passa a un campo di testo libero —
// necessario se la rosa non è ancora stata sincronizzata, o per un
// giocatore che l'ha lasciata dopo un pronostico già salvato con quel nome.
//
// Il campo resta sempre interattivo (mai `disabled`): scegliere un nome
// qui attiva da solo l'opzione "Un giocatore dell'Inter" tramite
// onSelectPlayer, invece di richiedere di spuntare prima il radio. Su
// mobile un <select> disabled può aprire comunque il picker nativo al tap
// senza che il valore venga poi inviato, lasciando il pronostico salvato
// come "nessun marcatore" pur avendo scelto un giocatore.
export function ScorerPlayerField({
  squad,
  value,
  onChange,
  active,
  onSelectPlayer,
}: {
  squad: string[];
  value: string;
  onChange: (value: string) => void;
  active: boolean;
  onSelectPlayer: () => void;
}) {
  const [manualMode, setManualMode] = useState(
    squad.length === 0 || (!!value && !squad.includes(value)),
  );
  const dimClass = active ? "" : "opacity-50";

  if (manualMode) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="scorerPlayerName"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value) onSelectPlayer();
          }}
          placeholder="Nome giocatore"
          className={`${inputClass} ${dimClass}`}
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
      value={squad.includes(value) ? value : ""}
      onChange={(e) => {
        if (e.target.value === "__other__") {
          setManualMode(true);
          return;
        }
        onChange(e.target.value);
        if (e.target.value) onSelectPlayer();
      }}
      className={`${inputClass} ${dimClass}`}
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
