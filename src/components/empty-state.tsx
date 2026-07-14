import type { ComponentType } from "react";

export function EmptyState({
  icon: Icon,
  message,
  compact = false,
}: {
  icon: ComponentType<{ className?: string }>;
  message: string;
  /** Niente card/ombra propria: per quando è già dentro un contenitore con sfondo. */
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 text-center ${
        compact ? "py-4" : "rounded-2xl bg-surface p-8 shadow-card"
      }`}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-inter-navy-soft text-inter-navy">
        <Icon className="size-5" />
      </span>
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}
