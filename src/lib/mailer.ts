import "server-only";
import { Resend } from "resend";
// import nodemailer from "nodemailer";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "ilGiochino <noreply@ilgiochino.it>";

// -- Gmail SMTP ------------------------------------------------------------
// Tenuto commentato (non rimosso): usato in attesa che il dominio
// ilgiochino.it fosse verificato su Resend. Si puo' tornare a questa
// implementazione se il dominio dovesse smettere di essere verificato.
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.GMAIL_USER,
//     pass: process.env.GMAIL_APP_PASSWORD,
//   },
// });
// const FROM_GMAIL = process.env.EMAIL_FROM ?? process.env.GMAIL_USER ?? "";
// --------------------------------------------------------------------------

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  // Non facciamo fallire il chiamante (cron) per un errore di invio: lo
  // logghiamo e basta, cosi' un problema con un singolo indirizzo non blocca
  // il resto del giro (altre email, aggiornamento reminderSentAt, ecc.).
  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  if (error) {
    console.error(`sendEmail: invio a ${params.to} fallito:`, error);
  }

  // -- Gmail SMTP (fallback storico) --
  // try {
  //   await transporter.sendMail({
  //     from: FROM_GMAIL,
  //     to: params.to,
  //     subject: params.subject,
  //     html: params.html,
  //   });
  // } catch (error) {
  //   console.error(`sendEmail: invio a ${params.to} fallito:`, error);
  // }
}
