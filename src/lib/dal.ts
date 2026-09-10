import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { LeagueRole } from "@/generated/prisma/enums";

// Data Access Layer: unico punto da cui passano i controlli di autenticazione
// e autorizzazione. Il proxy fa solo un controllo ottimistico sul cookie;
// qui si riverifica sempre lo stato reale dell'utente sul DB (una User
// disabilitata dall'admin perde l'accesso alla prossima richiesta, anche se
// la sessione JWT è ancora valida).
export const verifySession = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await verifySession();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || user.status !== "ACTIVE") {
    redirect("/login");
  }

  return user;
});

export const requireAdmin = cache(async () => {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
});

const LEAGUE_ROLE_RANK: Record<LeagueRole, number> = {
  MEMBER: 0,
  MODERATOR: 1,
  OWNER: 2,
};

// Autorizzazione per le pagine scoped-per-lega (Step 4, vedi piano):
// Role.ADMIN resta un bypass globale (§4 del doc — createMatch/
// setManualResult restano invece SEMPRE dietro requireAdmin, mai
// delegabili a un OWNER di lega, perché una partita è condivisa tra tutte
// le leghe che seguono la stessa squadra). Non cache()-ata come le altre
// funzioni qui sopra: dipende da un leagueId per chiamata, non da un unico
// valore per request.
export async function requireLeagueRole(leagueId: string, minRole: LeagueRole) {
  const user = await getCurrentUser();
  if (user.role === "ADMIN") return user;

  const membership = await prisma.leagueMembership.findUnique({
    where: { userId_leagueId: { userId: user.id, leagueId } },
  });
  if (!membership || LEAGUE_ROLE_RANK[membership.role] < LEAGUE_ROLE_RANK[minRole]) {
    redirect("/");
  }
  return user;
}

export const getActiveSeason = cache(async () => {
  return prisma.season.findFirstOrThrow({ where: { isActive: true } });
});

// Fix minimo per lo Step 3 (motore di scoring per-lega): ogni utente oggi è
// membro di una sola lega (la "storica" di backfill, vedi piano), quindi
// risolverla dalla sua LeagueMembership più vecchia riproduce esattamente il
// comportamento pre-scoping. Le pagine che oggi leggono MatchScore/
// PlayerStreakState senza nozione di lega usano questo helper come ponte;
// lo Step 5 lo sostituirà con un leagueId esplicito preso dalla route.
export const getDefaultLeague = cache(async () => {
  const user = await getCurrentUser();
  const membership = await prisma.leagueMembership.findFirstOrThrow({
    where: { userId: user.id },
    orderBy: { joinedAt: "asc" },
    include: { league: true },
  });
  return membership.league;
});

// Permette di sfogliare una stagione passata (es. dal selettore in
// classifica/partite) passando il suo id; senza id o con un id non
// valido si ricade sulla stagione attiva.
export const getSeason = cache(async (seasonId?: string) => {
  if (seasonId) {
    const season = await prisma.season.findUnique({ where: { id: seasonId } });
    if (season) return season;
  }
  return getActiveSeason();
});

// Regola di riservatezza (vedi piano): prima del deadline un utente vede
// solo il proprio pronostico, mai quelli altrui — indipendentemente dal
// ruolo (anche un admin che gioca non deve poter sbirciare in anticipo).
// Dopo il deadline tutti i pronostici di quella partita diventano visibili
// a chiunque. Centralizzare qui questo controllo evita di doverlo
// reimplementare (e rischiare di dimenticarlo) in più pagine/azioni.
export const getVisiblePredictions = cache(async (matchId: string) => {
  const user = await getCurrentUser();
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  const revealed = Date.now() >= match.predictionDeadlineAt.getTime();

  if (revealed) {
    return prisma.prediction.findMany({
      where: { matchId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
    });
  }

  return prisma.prediction.findMany({
    where: { matchId, userId: user.id },
    include: { user: { select: { id: true, name: true } } },
  });
});
