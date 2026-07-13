"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";

export type CreateSeasonState = { error?: string } | undefined;

// Rollover stagione: crea la nuova Season come attiva e disattiva tutte le
// altre nella stessa transazione. Streak e classifica ripartono da zero
// senza bisogno di codice dedicato: PlayerStreakState è scoped per
// (userId, seasonId), quindi la nuova stagione semplicemente non ha ancora
// righe (vedi recomputeSeasonFrom, che tratta l'assenza come streak a 0).
export async function createSeason(
  _prevState: CreateSeasonState,
  formData: FormData,
): Promise<CreateSeasonState> {
  await requireAdmin();

  const label = String(formData.get("label") ?? "").trim();
  if (!label) {
    return { error: "L'etichetta della stagione è obbligatoria." };
  }

  const existing = await prisma.season.findUnique({ where: { label } });
  if (existing) {
    return { error: "Esiste già una stagione con questa etichetta." };
  }

  await prisma.$transaction([
    prisma.season.updateMany({ data: { isActive: false } }),
    prisma.season.create({ data: { label, isActive: true } }),
  ]);

  revalidatePath("/admin/seasons");
}
