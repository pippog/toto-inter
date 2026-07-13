"use client";

import { useActionState } from "react";
import { changePasswordAction } from "./actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded border border-black/10 p-4 dark:border-white/10"
    >
      <h2 className="font-medium">Cambia password</h2>
      <label className="flex flex-col gap-1 text-sm">
        Password attuale
        <input
          name="currentPassword"
          type="password"
          required
          className="rounded border border-black/10 bg-transparent px-2 py-1 dark:border-white/10"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Nuova password
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="rounded border border-black/10 bg-transparent px-2 py-1 dark:border-white/10"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Conferma nuova password
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="rounded border border-black/10 bg-transparent px-2 py-1 dark:border-white/10"
        />
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-600">Password aggiornata.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
      >
        {pending ? "Aggiornamento…" : "Aggiorna password"}
      </button>
    </form>
  );
}
