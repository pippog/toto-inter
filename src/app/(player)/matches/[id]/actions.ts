"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import type { ScorerKind } from "@/generated/prisma/enums";

export type PredictionFormState = { error?: string; success?: boolean } | undefined;

export async function submitPrediction(
  matchId: string,
  _prevState: PredictionFormState,
  formData: FormData,
): Promise<PredictionFormState> {
  const user = await getCurrentUser();

  // La deadline va sempre riverificata qui contro il valore nel DB, mai
  // fidandosi dello stato caricato in pagina (una tab rimasta aperta oltre
  // il deadline non deve poter inviare comunque).
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (Date.now() >= match.predictionDeadlineAt.getTime()) {
    return { error: "Il termine per pronosticare questa partita è scaduto." };
  }

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
  if (!["PLAYER_GOAL", "OWN_GOAL", "NONE"].includes(scorerKind)) {
    return { error: "Seleziona un'opzione valida per il marcatore." };
  }
  const scorerPlayerName =
    scorerKind === "PLAYER_GOAL"
      ? String(scorerPlayerNameRaw ?? "").trim()
      : null;
  if (scorerKind === "PLAYER_GOAL" && !scorerPlayerName) {
    return { error: "Inserisci il nome del giocatore che segna per l'Inter." };
  }

  await prisma.prediction.upsert({
    where: { matchId_userId: { matchId, userId: user.id } },
    update: {
      predictedHomeScore: homeScore,
      predictedAwayScore: awayScore,
      predictedScorerKind: scorerKind,
      predictedScorerPlayerName: scorerPlayerName,
    },
    create: {
      matchId,
      userId: user.id,
      predictedHomeScore: homeScore,
      predictedAwayScore: awayScore,
      predictedScorerKind: scorerKind,
      predictedScorerPlayerName: scorerPlayerName,
    },
  });

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");
  return { success: true };
}
