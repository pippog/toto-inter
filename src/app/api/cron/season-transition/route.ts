import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";
import { sendPushToUser } from "@/lib/webPush";
import { formatItalianDateTime, parseItalianLocalDateTime } from "@/lib/italianTime";

const SITE_URL = "https://www.ilgiochino.it";

// Rollover una tantum dalle amichevoli estive alla stagione ufficiale 2026-27
// (già in DB con tutto il calendario di Serie A, vedi
// prisma/seed-serie-a-2026-27.ts). Etichette hardcoded perché è un passaggio
// specifico e irripetibile, non un meccanismo di rollover generico — il
// prossimo cambio stagione si farà a mano da /admin/seasons.
const TEST_SEASON_LABEL = "Test estate 2026";
const OFFICIAL_SEASON_LABEL = "2026-27";

// Orario di invio richiesto: 10:00 ora italiana del 19/8/2026 (non solo "quel
// giorno", altrimenti il primo giro del workflow nella finestra — anche
// mattina presto — farebbe scattare l'invio prima dell'orario voluto).
const TRANSITION_AT = parseItalianLocalDateTime("2026-08-19T10:00");

// Guardia idempotente: il workflow che chiama questo endpoint gira più volte
// nella finestra attorno al 19/8 (vedi .github/workflows/season-transition.yml)
// per tollerare salti/ritardi dello scheduler, ma il rollover deve avvenire
// una volta sola: se la stagione Test non è più quella attiva, è già stato
// fatto (o lo stato non è quello atteso) e non c'è altro da fare.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (new Date() < TRANSITION_AT) {
    return NextResponse.json({ skipped: "not-yet-transition-time", transitionAt: TRANSITION_AT });
  }

  const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
  if (activeSeason?.label !== TEST_SEASON_LABEL) {
    return NextResponse.json({ skipped: "already-transitioned-or-unexpected-state" });
  }

  const officialSeason = await prisma.season.findUnique({ where: { label: OFFICIAL_SEASON_LABEL } });
  if (!officialSeason) {
    return NextResponse.json({ error: `Stagione "${OFFICIAL_SEASON_LABEL}" non trovata` }, { status: 500 });
  }

  await prisma.$transaction([
    prisma.season.update({ where: { id: activeSeason.id }, data: { isActive: false } }),
    prisma.season.update({ where: { id: officialSeason.id }, data: { isActive: true } }),
  ]);

  const firstMatch = await prisma.match.findFirst({
    where: { seasonId: officialSeason.id },
    orderBy: { kickoffAt: "asc" },
  });
  const opponentLine = firstMatch
    ? firstMatch.isHome
      ? `Inter - ${firstMatch.opponent}`
      : `${firstMatch.opponent} - Inter`
    : null;
  const kickoffLabel = firstMatch ? formatItalianDateTime(firstMatch.kickoffAt) : null;

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, email: true, name: true },
  });

  let emailsSent = 0;
  let pushSent = 0;

  for (const user of users) {
    await sendEmail({
      to: user.email,
      subject: "Si comincia! La stagione ufficiale 2026/27 sta per partire",
      html: `
        <p style="font-size:18px;"><strong>PRONOSTICO AMARAL</strong></p>
        <p>Ciao ${user.name}, grazie per aver partecipato alle amichevoli estive di test!
        Sono finite: da oggi il Giochino passa alla stagione ufficiale <strong>2026/27</strong>.</p>
        <p>${
          opponentLine
            ? `Il weekend prossimo si parte sul serio con <strong>${opponentLine}</strong>, calcio d'inizio alle ${kickoffLabel}.`
            : "Il weekend prossimo parte ufficialmente la stagione."
        }</p>
        <p><a href="${SITE_URL}/matches">Vai al Giochino</a></p>
      `,
    });
    emailsSent++;

    // Best-effort come per gli altri cron: un errore push non deve bloccare
    // l'invio email né gli utenti successivi nel loop.
    try {
      await sendPushToUser(user.id, {
        title: "Si comincia! La stagione ufficiale 2026/27 sta per partire",
        body: opponentLine
          ? `Grazie per aver partecipato alle amichevoli estive di test! Sono finite: da oggi il Giochino passa alla stagione ufficiale 2026/27. Il weekend prossimo si parte sul serio con ${opponentLine}, calcio d'inizio alle ${kickoffLabel}.`
          : "Grazie per aver partecipato alle amichevoli estive di test! Sono finite: da oggi il Giochino passa alla stagione ufficiale 2026/27. Il weekend prossimo parte ufficialmente la stagione.",
        url: "/matches",
      });
      pushSent++;
    } catch (error) {
      console.error(`season-transition: push a ${user.id} fallito:`, error);
    }
  }

  return NextResponse.json({
    transitioned: { from: activeSeason.label, to: officialSeason.label },
    firstMatch: firstMatch ? { opponent: firstMatch.opponent, kickoffAt: firstMatch.kickoffAt } : null,
    emailsSent,
    pushSent,
  });
}
