"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";

export type ActionState = { error?: string; success?: boolean } | undefined;

export async function createTeam(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const externalRef = String(formData.get("externalRef") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim() || null;

  if (!name || !externalRef) {
    return { error: "Nome e id Highlightly sono obbligatori." };
  }

  const existing = await prisma.team.findUnique({ where: { externalRef } });
  if (existing) {
    return { error: "Esiste già una squadra con questo id Highlightly." };
  }

  await prisma.team.create({ data: { name, externalRef, logoUrl } });

  revalidatePath("/admin/teams");
  return { success: true };
}

export async function setTeamActive(teamId: string, active: boolean) {
  await requireAdmin();
  await prisma.team.update({ where: { id: teamId }, data: { active } });
  revalidatePath("/admin/teams");
}
