"use client";

import { useActionState, useState } from "react";
import { Avatar } from "@/components/avatar";
import { updateProfileAction } from "./actions";

type Initial = {
  name: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? "");
  const [name, setName] = useState(initial.name);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-xl border border-black/10 p-4"
    >
      <h2 className="font-medium text-inter-navy">Modifica profilo</h2>

      <div className="flex items-center gap-3">
        <Avatar name={name || initial.name} avatarUrl={avatarUrl} size={48} />
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Immagine profilo (URL)
          <input
            name="avatarUrl"
            type="url"
            placeholder="https://…"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Alias (visibile a tutti in classifica e pronostici)
        <input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
        />
      </label>

      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Nome
          <input
            name="firstName"
            defaultValue={initial.firstName ?? ""}
            className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Cognome
          <input
            name="lastName"
            defaultValue={initial.lastName ?? ""}
            className="rounded-lg border border-black/10 bg-transparent px-2 py-1 focus:border-inter-navy focus:outline-none"
          />
        </label>
      </div>
      <p className="text-xs text-zinc-500">
        Nome e cognome restano privati: li vedi solo tu e l&apos;admin, mai in classifica.
      </p>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600">Profilo aggiornato.</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-inter-navy px-4 py-2 text-white transition-colors hover:bg-inter-navy-light disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : "Salva profilo"}
      </button>
    </form>
  );
}
