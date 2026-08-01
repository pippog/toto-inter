import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";
import { competitionLabel } from "@/lib/competition";
import { formatItalianDateTime } from "@/lib/italianTime";

const SITE_URL = "https://amaralgame.vercel.app";

// Invia il reminder non appena il fischio d'inizio è entro questa soglia da
// ora, senza un limite inferiore: un limite inferiore (es. "solo se il
// kickoff è tra 90 e 150 minuti da ora") creerebbe una finestra che scorre
// con il tempo e può chiudersi senza che nessuna esecuzione del cron l'abbia
// mai intercettata (successo il 2026-08-01: GitHub Actions ha saltato/
// ritardato l'esecuzione nella finestra utile e il reminder non è mai
// partito). Con reminderSentAt come guardia contro i doppi invii, una volta
// che una partita entra in questa soglia resta idonea a ogni giro finché non
// viene effettivamente inviata: il cron gira ogni 15 min via GitHub Actions
// ma anche se salta più giri di fila, il primo giro successivo la recupera.
const REMINDER_LEAD_TIME_MINUTES = 150;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_LEAD_TIME_MINUTES * 60_000);

  const matches = await prisma.match.findMany({
    where: {
      kickoffAt: { gt: now, lte: windowEnd },
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
