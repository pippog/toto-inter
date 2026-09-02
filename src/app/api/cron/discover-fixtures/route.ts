import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { getActiveSeason } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { highlightlyProvider, INTER_TEAM_ID } from "@/lib/football-provider/highlightlyProvider";
import { sendEmail } from "@/lib/mailer";
import { competitionLabel } from "@/lib/competition";
import { formatItalianDateTime } from "@/lib/italianTime";
import type { Competition } from "@/generated/prisma/enums";

// Vestigiale: era la finestra massima accettata dal piano Free di
// API-Football. Highlightly non ha questo limite (findUpcomingFixtures
// ritorna tutto il calendario noto in una volta), il parametro resta solo
// per compatibilità di firma con FootballDataProvider.
const DISCOVERY_WINDOW_DAYS = 3;
const PREDICTION_DEADLINE_MINUTES_BEFORE_KICKOFF = 5;

// Tolleranza per "adottare" una partita creata a mano invece di duplicarla
// (vedi sotto): deve assorbire anche uno spostamento TV (es. da domenica
// 18:00 a venerdì sera o lunedì sera), non solo un'imprecisione di orario.
// La sicurezza del match non dipende da questa finestra ma dalla coppia
// stagione+avversario: l'Inter non gioca mai due volte contro lo stesso
// avversario in campionato a pochi giorni di distanza, quindi allargarla
// non rischia di agganciare la partita sbagliata.
const MANUAL_MATCH_ADOPTION_TOLERANCE_MS = 5 * 24 * 60 * 60 * 1000;

// Confronto robusto tra il nome avversario inserito a mano e quello
// ufficiale del provider (es. "Karlsruhe" vs "Karlsruher SC"): un `equals`
// esatto fallisce su sigle societarie o abbreviazioni, quindi si normalizza
// (accenti, punteggiatura, sigle societarie comuni) e si accetta anche un
// contenimento in un senso o nell'altro.
const CLUB_SUFFIXES = /\b(sc|fc|ac|as|us|cf|ssc|calcio|club|cd|sv|fk|bc)\b/g;

const DIACRITICS_PATTERN = new RegExp("[̀-ͯ]", "g");

function normalizeOpponentName(name: string): string {
  return name
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .toLowerCase()
    .replace(CLUB_SUFFIXES, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isSameOpponent(a: string, b: string): boolean {
  const na = normalizeOpponentName(a);
  const nb = normalizeOpponentName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

// Scopre le prossime partite dell'Inter e crea le righe Match da confermare
// (mai risultati, solo calendario — vedi piano). Idempotente: identifica le
// partite già note tramite external_ref (unique), aggiornando kickoff_at
// solo se l'orario è cambiato (partita rinviata/recuperata). Se una partita
// è già stata creata a mano (senza external_ref) prima che la scoperta
// automatica la raggiungesse, la adotta (le assegna l'external_ref) invece
// di crearne una seconda identica.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const season = await getActiveSeason();
  const fixtures = await highlightlyProvider.findUpcomingFixtures(
    INTER_TEAM_ID,
    DISCOVERY_WINDOW_DAYS,
  );

  let created = 0;
  let updated = 0;
  let adopted = 0;

  // Solo le partite nuove/agganciate finiscono nella mail di conferma
  // all'admin: un aggiornamento di orario su una partita già nota non è
  // un evento da controllare a mano quanto le prime due.
  const notifyMatches: { opponent: string; kickoffAt: Date; competition: Competition; kind: "created" | "adopted" }[] = [];

  for (const fx of fixtures) {
    const deadline = new Date(
      fx.kickoffAt.getTime() - PREDICTION_DEADLINE_MINUTES_BEFORE_KICKOFF * 60_000,
    );

    const existing = await prisma.match.findUnique({ where: { externalRef: fx.externalRef } });

    if (existing) {
      if (existing.kickoffAt.getTime() !== fx.kickoffAt.getTime()) {
        await prisma.match.update({
          where: { id: existing.id },
          data: { kickoffAt: fx.kickoffAt, predictionDeadlineAt: deadline },
        });
        updated++;
      }
      continue;
    }

    const manualMatches = await prisma.match.findMany({
      where: {
        seasonId: season.id,
        externalRef: null,
      },
    });
    const adoptable = manualMatches.find(
      (m) =>
        isSameOpponent(m.opponent, fx.opponent) &&
        Math.abs(m.kickoffAt.getTime() - fx.kickoffAt.getTime()) <=
          MANUAL_MATCH_ADOPTION_TOLERANCE_MS,
    );

    if (adoptable) {
      await prisma.match.update({
        where: { id: adoptable.id },
        data: {
          externalRef: fx.externalRef,
          competition: fx.competition,
          isHome: fx.isHome,
          kickoffAt: fx.kickoffAt,
          predictionDeadlineAt: deadline,
          // Il logo inserito a mano vince se già presente: il sync non deve
          // sovrascrivere una scelta manuale, solo colmare un buco.
          ...(adoptable.opponentLogoUrl ? {} : { opponentLogoUrl: fx.opponentLogoUrl }),
        },
      });
      adopted++;
      notifyMatches.push({ opponent: fx.opponent, kickoffAt: fx.kickoffAt, competition: fx.competition, kind: "adopted" });
      continue;
    }

    await prisma.match.create({
      data: {
        seasonId: season.id,
        competition: fx.competition,
        opponent: fx.opponent,
        opponentLogoUrl: fx.opponentLogoUrl,
        isHome: fx.isHome,
        kickoffAt: fx.kickoffAt,
        predictionDeadlineAt: deadline,
        externalRef: fx.externalRef,
      },
    });
    created++;
    notifyMatches.push({ opponent: fx.opponent, kickoffAt: fx.kickoffAt, competition: fx.competition, kind: "created" });
  }

  if (notifyMatches.length > 0 && process.env.ADMIN_EMAIL) {
    const rows = notifyMatches
      .map(
        (m) =>
          `<li>${m.kind === "created" ? "🆕 Nuova" : "🔗 Agganciata"}: ${m.opponent} — ` +
          `${competitionLabel(m.competition)} — ${formatItalianDateTime(m.kickoffAt)}</li>`,
      )
      .join("");
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `🤖 Discovery partite: ${created} nuove, ${adopted} agganciate`,
      html: `<p>Il cron di scoperta partite ha trovato:</p><ul>${rows}</ul>`,
    });
  }

  return NextResponse.json({ found: fixtures.length, created, updated, adopted });
}
