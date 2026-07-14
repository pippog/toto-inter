import type { Competition } from "@/generated/prisma/enums";

export const COMPETITION_LABELS: Record<Competition, string> = {
  SERIE_A: "Serie A",
  COPPA_ITALIA: "Coppa Italia",
  CHAMPIONS_LEAGUE: "Champions League",
  EUROPA_LEAGUE: "Europa League",
  FRIENDLY: "Amichevole",
  OTHER: "Altro",
};

export const COMPETITION_ACCENTS: Record<Competition, { text: string; bg: string }> = {
  SERIE_A: { text: "text-accent-sky", bg: "bg-accent-sky-soft" },
  COPPA_ITALIA: { text: "text-accent-amber", bg: "bg-accent-amber-soft" },
  CHAMPIONS_LEAGUE: { text: "text-accent-violet", bg: "bg-accent-violet-soft" },
  EUROPA_LEAGUE: { text: "text-accent-teal", bg: "bg-accent-teal-soft" },
  FRIENDLY: { text: "text-zinc-500", bg: "bg-zinc-100" },
  OTHER: { text: "text-accent-rose", bg: "bg-accent-rose-soft" },
};

export function competitionLabel(competition: string): string {
  return COMPETITION_LABELS[competition as Competition] ?? competition;
}
