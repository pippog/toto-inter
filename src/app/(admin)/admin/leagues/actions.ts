"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";

export type ActionState = { error?: string; success?: boolean } | undefined;

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createLeague(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const teamId = String(formData.get("teamId") ?? "").trim();

  if (!name || !teamId) {
    return { error: "Nome e squadra sono obbligatori." };
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return { error: "Squadra non valida." };
  }

  const baseSlug = slugify(name) || "lega";
  let slug = baseSlug;
  let suffix = 2;
  while (await prisma.league.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  await prisma.$transaction(async (tx) => {
    const league = await tx.league.create({
      data: { name, slug, teamId, createdByUserId: admin.id },
    });
    await tx.leagueMembership.create({
      data: { userId: admin.id, leagueId: league.id, role: "OWNER" },
    });
  });

  revalidatePath("/admin/leagues");
  return { success: true };
}
