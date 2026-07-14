"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateOpponentLogo } from "../../actions";

export function LogoForm({
  matchId,
  opponentLogoUrl,
}: {
  matchId: string;
  opponentLogoUrl: string | null;
}) {
  const boundAction = updateOpponentLogo.bind(null, matchId);
  const [state, action, pending] = useActionState(boundAction, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl bg-surface shadow-card p-4"
    >
      <h2 className="font-medium text-heading">Logo avversario</h2>
      <label className="flex flex-col gap-1 text-sm">
        URL immagine (opzionale)
        <input
          name="opponentLogoUrl"
          type="url"
          defaultValue={opponentLogoUrl ?? ""}
          placeholder="https://…"
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        />
      </label>

      {state?.success && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-accent-teal [animation:rise-in_0.3s_ease-out_both]">
          <Check className="size-4" />
          Logo aggiornato.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-inter-navy px-4 py-2.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-inter-navy-light hover:shadow-md active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : "Salva logo"}
      </button>
    </form>
  );
}
