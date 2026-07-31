import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";
import { competitionLabel } from "@/lib/competition";
import { formatItalianDateTime } from "@/lib/italianTime";

const SITE_URL = "https://amaralgame.vercel.app";

// Finestra di 1 ora centrata 2 ore prima del fischio d'inizio: il cron gira
// ogni 15-30 min via GitHub Actions (Vercel Hobby non permette cron nativi
// più frequenti di 1/giorno, vedi discover-fixtures/sync-results), quindi la
// finestra deve essere più larga dell'intervallo tra due giri per non perdere
// mai una partita anche in caso di ritardo di un'esecuzione.
const REMINDER_WINDOW_START_MINUTES = 90;
const REMINDER_WINDOW_END_MINUTES = 150;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + REMINDER_WINDOW_START_MINUTES * 60_000);
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_END_MINUTES * 60_000);

  const matches = await prisma.match.findMany({
    where: {
      kickoffAt: { gte: windowStart, lte: windowEnd },
      reminderSentAt: null,
      status: { not: "FINISHED" },
    },
    include: { predictions: { select: { userId: true } } },
  });

  let matchesProcessed = 0;
  let emailsSent = 0;

  for (const match of matches) {
    const predictedUserIds = new Set(match.predictions.map((p) => p.userId));
    const missingUsers = await prisma.user.findMany({
      where: { status: "ACTIVE", id: { notIn: [...predictedUserIds] } },
      select: { id: true, email: true, name: true },
    });

    const opponentLine = match.isHome ? `Inter - ${match.opponent}` : `${match.opponent} - Inter`;
    const kickoffLabel = formatItalianDateTime(match.kickoffAt);

    for (const user of missingUsers) {
      await sendEmail({
        to: user.email,
        subject: "PRONOSTICO AMARAL",
        html: `
          <p style="font-size:18px;"><strong>PRONOSTICO AMARAL</strong></p>
          <p>Ciao ${user.name}, non hai ancora impostato il pronostico per la partita
          <strong>${opponentLine}</strong> (${competitionLabel(match.competition)}),
          calcio d'inizio alle ${kickoffLabel}.</p>
          <p><a href="${SITE_URL}/matches/${match.id}">Fai il pronostico ora</a></p>
        `,
      });
      emailsSent++;
    }

    await prisma.match.update({ where: { id: match.id }, data: { reminderSentAt: now } });
    matchesProcessed++;
  }

  return NextResponse.json({ matchesProcessed, emailsSent });
}
