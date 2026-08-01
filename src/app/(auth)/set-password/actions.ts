"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";

export type SetPasswordState = { error?: string } | undefined;

export async function setPasswordAction(
  _prevState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { error: "Link di invito non valido." };
  }
  if (password.length < 8) {
    return { error: "La password deve avere almeno 8 caratteri." };
  }
  if (password !== confirmPassword) {
    return { error: "Le password non coincidono." };
  }

  const user = await prisma.user.findUnique({ where: { inviteToken: token } });
  if (!user || !user.inviteExpires || user.inviteExpires < new Date()) {
    return { error: "Link non valido o scaduto. Richiedine uno nuovo." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      status: "ACTIVE",
      inviteToken: null,
      inviteExpires: null,
    },
  });

  try {
    await signIn("credentials", {
      email: user.email,
      password,
      redirectTo: "/matches",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Password impostata. Vai al login e accedi con le tue credenziali.",
      };
    }
    throw error;
  }
}
