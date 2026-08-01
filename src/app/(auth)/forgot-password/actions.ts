"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";

export type ForgotPasswordState = { message?: string; error?: string } | undefined;

const SITE_URL = "https://www.ilgiochino.it";
const RESET_TOKEN_EXPIRY_HOURS = 1;

// Messaggio identico sia che l'email esista sia che non esista, per non
// rivelare a chi prova indirizzi a caso quali email sono registrate.
const GENERIC_SUCCESS_MESSAGE =
  "Se l'indirizzo è registrato, riceverai a breve una mail con le istruzioni per impostare una nuova password.";

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { error: "Inserisci la tua email." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const resetToken = randomBytes(24).toString("base64url");
    const resetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { inviteToken: resetToken, inviteExpires: resetExpires },
    });

    await sendEmail({
      to: user.email,
      subject: "Reset password ilGiochino",
      html: `
        <p style="font-size:18px;"><strong>ilGiochino</strong></p>
        <p>Ciao ${user.name}, hai chiesto di reimpostare la password.</p>
        <p><a href="${SITE_URL}/set-password?token=${resetToken}">Imposta una nuova password</a></p>
        <p>Il link scade tra ${RESET_TOKEN_EXPIRY_HOURS} ora. Se non hai richiesto tu il reset, ignora questa mail.</p>
      `,
    });
  }

  return { message: GENERIC_SUCCESS_MESSAGE };
}
