"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/db";

export type ActionState = { error?: string; inviteLink?: string } | undefined;

const INVITE_EXPIRY_DAYS = 7;

export async function inviteUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!name || !email) {
    return { error: "Nome ed email sono obbligatori." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Esiste già un utente con questa email." };
  }

  const inviteToken = randomBytes(24).toString("base64url");
  const inviteExpires = new Date(
    Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.user.create({
    data: {
      name,
      email,
      status: "INVITED",
      role: "PLAYER",
      inviteToken,
      inviteExpires,
    },
  });

  revalidatePath("/admin/users");

  return {
    inviteLink: `/set-password?token=${inviteToken}`,
  };
}

export async function setUserStatus(userId: string, status: "ACTIVE" | "DISABLED") {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { status } });
  revalidatePath("/admin/users");
}

export async function setUserRole(userId: string, role: "PLAYER" | "ADMIN") {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}
