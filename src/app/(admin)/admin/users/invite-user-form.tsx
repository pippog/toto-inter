"use client";

import { useActionState } from "react";
import { inviteUser } from "./actions";

export function InviteUserForm() {
  const [state, action, pending] = useActionState(inviteUser, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl bg-surface shadow-card p-4"
    >
      <h2 className="font-medium text-heading">Invita un giocatore</h2>
      <div className="flex gap-2">
        <input
          name="name"
          placeholder="Nome"
          required
          className="flex-1 rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="flex-1 rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.inviteLink && (
        <p className="text-sm">
          Invito creato. Condividi manualmente questo link (es. WhatsApp):{" "}
          <code className="break-all rounded bg-zinc-100 px-1">
            {typeof window !== "undefined" ? window.location.origin : ""}
            {state.inviteLink}
          </code>
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-inter-navy px-4 py-2.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-inter-navy-light hover:shadow-md active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Invio…" : "Crea invito"}
      </button>
    </form>
  );
}
