"use client";

import { useActionState } from "react";
import { forgotPasswordAction } from "./actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, undefined);

  if (state?.message) {
    return <p className="text-sm text-zinc-600">{state.message}</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm text-zinc-500">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-lg border border-black/10 bg-transparent px-3 py-2 focus:border-inter-navy focus:outline-none"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-xl bg-inter-navy px-4 py-2.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-inter-navy-light hover:shadow-md active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Invio…" : "Invia link di reset"}
      </button>
    </form>
  );
}
