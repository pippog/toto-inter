"use client";

import { useActionState } from "react";
import { inviteUser } from "./actions";

export function InviteUserForm() {
  const [state, action, pending] = useActionState(inviteUser, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded border border-black/10 p-4 dark:border-white/10"
    >
      <h2 className="font-medium">Invita un giocatore</h2>
      <div className="flex gap-2">
        <input
          name="name"
          placeholder="Nome"
          required
          className="flex-1 rounded border border-black/10 bg-transparent px-2 py-1 dark:border-white/10"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="flex-1 rounded border border-black/10 bg-transparent px-2 py-1 dark:border-white/10"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.inviteLink && (
        <p className="text-sm">
          Invito creato. Condividi manualmente questo link (es. WhatsApp):{" "}
          <code className="break-all rounded bg-black/5 px-1 dark:bg-white/10">
            {typeof window !== "undefined" ? window.location.origin : ""}
            {state.inviteLink}
          </code>
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
      >
        {pending ? "Invio…" : "Crea invito"}
      </button>
    </form>
  );
}
