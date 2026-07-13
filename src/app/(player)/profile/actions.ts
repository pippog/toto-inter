"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/db";

export type UpdateProfileState = { error?: string; success?: boolean } | undefined;

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// L'alias (name) resta pubblico e visibile ovunque (classifica, pronostici
// rivelati, sidebar) — nome/cognome restano privati (solo l'utente stesso e
// l'admin li vedono, mai in classifica).
export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const user = await getCurrentUser();

  const name = String(formData.get("name") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();

  if (!name) {
    return { error: "L'alias è obbligatorio." };
  }
  if (avatarUrl && !isValidHttpUrl(avatarUrl)) {
    return { error: "L'URL dell'immagine profilo non è valido." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      firstName: firstName || null,
      lastName: lastName || null,
      avatarUrl: avatarUrl || null,
    },
  });

  revalidatePath("/", "layout");

  return { success: true };
}

export type ChangePasswordState = { error?: string; success?: boolean } | undefined;

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return { error: "Password attuale non corretta." };
  }
  if (newPassword.length < 8) {
    return { error: "La nuova password deve avere almeno 8 caratteri." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Le nuove password non coincidono." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { success: true };
}
