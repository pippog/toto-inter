import type { ReactNode } from "react";

export function Timeline({ children }: { children: ReactNode }) {
  return <ol className="flex flex-col">{children}</ol>;
}

export function TimelineItem({
  title,
  subtitle,
  trailing,
  tone = "default",
  last = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  tone?: "default" | "success" | "muted";
  last?: boolean;
}) {
  const dotStyle =
    tone === "success"
      ? "bg-accent-teal"
      : tone === "muted"
        ? "bg-zinc-300"
        : "bg-inter-gold";

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && <span className="absolute top-3 left-[5px] h-full w-px bg-zinc-100" />}
      <span className={`relative z-10 mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-surface ${dotStyle}`} />
      <div className="flex flex-1 items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-heading">{title}</span>
          {subtitle && <span className="text-xs text-zinc-500">{subtitle}</span>}
        </div>
        {trailing && <div className="text-sm">{trailing}</div>}
      </div>
    </li>
  );
}
