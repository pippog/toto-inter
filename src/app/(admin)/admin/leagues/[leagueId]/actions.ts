"use server";

import { revalidatePath } from "next/cache";
import { requireLeagueRole } from "@/lib/dal";
import { prisma } from "@/lib/db";
import type { LeagueRole } from "@/generated/prisma/enums";

export type ActionState = { error?: string } | undefined;

async function countOwners(leagueId: string) {
  return prisma.leagueMembership.count({ where: { leagueId, role: "OWNER" } });
}

export async function addMember(
  leagueId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireLeagueRole(leagueId, "OWNER");

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) {
    return { error: "Seleziona un utente." };
  }

  const existing = await prisma.leagueMembership.findUnique({
    where: { userId_leagueId: { userId, leagueId } },
  });
  if (existing) {
    return { error: "L'utente è già membro di questa lega." };
  }

  await prisma.leagueMembership.create({
    data: { userId, leagueId, role: "MEMBER" },
  });

  revalidatePath(`/admin/leagues/${leagueId}`);
}

export async function setMemberRole(leagueId: string, userId: string, role: LeagueRole) {
  await requireLeagueRole(leagueId, "OWNER");

  const membership = await prisma.leagueMembership.findUniqueOrThrow({
    where: { userId_leagueId: { userId, leagueId } },
  });
  // Ultima guardia: una lega senza nessun OWNER non ha più chi può
  // gestirla (requireLeagueRole richiede OWNER per queste azioni).
  if (membership.role === "OWNER" && role !== "OWNER" && (await countOwners(leagueId)) <= 1) {
    return;
  }

  await prisma.leagueMembership.update({
    where: { userId_leagueId: { userId, leagueId } },
    data: { role },
  });

  revalidatePath(`/admin/leagues/${leagueId}`);
}

export async function removeMember(leagueId: string, userId: string) {
  await requireLeagueRole(leagueId, "OWNER");

  const membership = await prisma.leagueMembership.findUniqueOrThrow({
    where: { userId_leagueId: { userId, leagueId } },
  });
  if (membership.role === "OWNER" && (await countOwners(leagueId)) <= 1) {
    return;
  }

  await prisma.leagueMembership.delete({
    where: { userId_leagueId: { userId, leagueId } },
  });

  revalidatePath(`/admin/leagues/${leagueId}`);
}
