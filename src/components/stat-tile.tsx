import type { ComponentType } from "react";
import { TiltCard } from "./tilt-card";
import { AnimatedNumber } from "./animated-number";

type Accent = "gold" | "navy" | "teal" | "amber" | "violet" | "rose" | "sky";

const ACCENT_STYLES: Record<Accent, string> = {
  gold: "bg-inter-gold-soft text-inter-navy-dark",
  navy: "bg-inter-navy-soft text-inter-navy",
  teal: "bg-accent-teal-soft text-accent-teal",
  amber: "bg-accent-amber-soft text-accent-amber",
  violet: "bg-accent-violet-soft text-accent-violet",
  rose: "bg-accent-rose-soft text-accent-rose",
  sky: "bg-accent-sky-soft text-accent-sky",
};

const PROGRESS_STYLES: Record<Accent, string> = {
  gold: "bg-inter-gold",
  navy: "bg-inter-navy",
  teal: "bg-accent-teal",
  amber: "bg-accent-amber",
  violet: "bg-accent-violet",
  rose: "bg-accent-rose",
  sky: "bg-accent-sky",
};

export function StatTile({
  icon: Icon,
  label,
  value,
  accent = "navy",
  progress,
  decimals = 0,
  suffix = "",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  /** Numero → si anima al mount; stringa (es. "#1", "—") → statico, per i casi che non sono un conteggio. */
  value: string | number;
  accent?: Accent;
  /** 0-100: se presente, mostra una barra di avanzamento sotto il valore. */
  progress?: number;
  decimals?: number;
  suffix?: string;
}) {
  return (
    <TiltCard className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-card">
      <span className={`flex size-9 items-center justify-center rounded-xl ${ACCENT_STYLES[accent]}`}>
        <Icon className="size-[18px]" />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-xl font-bold text-heading">
          {typeof value === "number" ? (
            <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
          ) : (
            value
          )}
        </span>
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full rounded-full ${PROGRESS_STYLES[accent]}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </TiltCard>
  );
}
