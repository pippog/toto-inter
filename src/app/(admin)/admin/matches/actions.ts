"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { applyMatchResult } from "@/lib/scoring/applyMatchResult";
import type { Competition, ScorerKind } from "@/generated/prisma/enums";

const DEADLINE_MINUTES_BEFORE_KICKOFF = 5;

export type ActionState = { error?: string } | undefined;

export async function createMatch(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const season = await prisma.season.findFirstOrThrow({
    where: { isActive: true },
  });

  const kickoffAtRaw = String(formData.get("kickoffAt"));
  const kickoffAt = new Date(kickoffAtRaw);
  if (Number.isNaN(kickoffAt.getTime())) {
    return { error: "Data/ora del calcio d'inizio non valida." };
  }
  const predictionDeadlineAt = new Date(
    kickoffAt.getTime() - DEADLINE_MINUTES_BEFORE_KICKOFF * 60_000,
  );

  const opponent = String(formData.get("opponent") ?? "").trim();
  if (!opponent) {
    return { error: "Inserisci l'avversario." };
  }

  await prisma.match.create({
    data: {
      seasonId: season.id,
      competition: formData.get("competition") as Competition,
      opponent,
      isHome: formData.get("isHome") === "on",
      kickoffAt,
      predictionDeadlineAt,
    },
  });

  revalidatePath("/admin/matches");
}

export async function setManualResult(
  matchId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const homeScore = Number(formData.get("homeScore"));
  const awayScore = Number(formData.get("awayScore"));
  const scorerKind = formData.get("scorerKind") as ScorerKind;
  const scorerPlayerNameRaw = formData.get("scorerPlayerName");

  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    return { error: "Inserisci un risultato valido (numeri interi >= 0)." };
  }
  const scorerPlayerName =
    scorerKind === "PLAYER_GOAL"
      ? String(scorerPlayerNameRaw ?? "").trim()
      : null;
  if (scorerKind === "PLAYER_GOAL" && !scorerPlayerName) {
    return { error: "Inserisci il nome del giocatore che segna per l'Inter." };
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore,
      awayScore,
      firstScorerKind: scorerKind,
      firstScorerPlayerName: scorerPlayerName,
      resultSource: "MANUAL",
    },
  });

  await applyMatchResult(matchId);

  revalidatePath(`/admin/matches/${matchId}/result`);
  revalidatePath("/admin/matches");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");
  revalidatePath("/leaderboard");
}
