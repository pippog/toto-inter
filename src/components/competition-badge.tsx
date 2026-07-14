import { COMPETITION_ACCENTS, competitionLabel } from "@/lib/competition";

export function CompetitionBadge({ competition }: { competition: string }) {
  const accent = COMPETITION_ACCENTS[competition as keyof typeof COMPETITION_ACCENTS] ?? {
    text: "text-zinc-500",
    bg: "bg-zinc-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${accent.bg} ${accent.text}`}
    >
      {competitionLabel(competition)}
    </span>
  );
}
