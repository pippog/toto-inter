"use client";

import { useActionState } from "react";
import { changePasswordAction } from "./actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-xl border border-black/10 p-4"
    >
      <h2 className="font-medium text-inter-navy">Cambia password</h2>
      <label className="flex flex-col gap-1 text-sm">
        Password attuale
        <input
          name="currentPassword"
          type="password"
          required
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Nuova password
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Conferma nuova password
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        />
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-600">Password aggiornata.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-inter-navy px-4 py-2 text-white transition-colors hover:bg-inter-navy-light disabled:opacity-50"
      >
        {pending ? "Aggiornamento…" : "Aggiorna password"}
      </button>
    </form>
  );
}
