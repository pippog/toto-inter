"use client";

import { useRouter, usePathname } from "next/navigation";

type SeasonOption = { id: string; label: string; isActive: boolean };

export function SeasonSelector({
  seasons,
  currentSeasonId,
}: {
  seasons: SeasonOption[];
  currentSeasonId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (seasons.length <= 1) return null;

  return (
    <div className="inline-flex w-fit gap-1 rounded-xl bg-foreground/5 p-1">
      {seasons.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => router.push(s.isActive ? pathname : `${pathname}?season=${s.id}`)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            s.id === currentSeasonId ? "bg-surface text-heading shadow-sm" : "text-zinc-500 hover:text-heading"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
