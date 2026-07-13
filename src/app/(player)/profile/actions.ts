"use server";

import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/db";

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
