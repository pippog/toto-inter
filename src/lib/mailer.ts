import "server-only";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Il mittente di default (dominio di test di Resend) funziona subito senza
// verificare un dominio proprio, ma Resend lo consegna solo a destinatari
// "fidati": va bene per un gruppo ristretto di amici, non per invii larghi.
const FROM = process.env.EMAIL_FROM ?? "Amaralgame <onboarding@resend.dev>";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  // Non facciamo fallire il chiamante (cron) per un errore di invio: lo
  // logghiamo e basta, cosi' un problema con un singolo indirizzo non blocca
  // il resto del giro (altre email, aggiornamento reminderSentAt, ecc.).
  if (error) {
    console.error(`sendEmail: invio a ${params.to} fallito:`, error);
  }
}
