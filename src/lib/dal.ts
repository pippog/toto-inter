import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

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

export const getActiveSeason = cache(async () => {
  return prisma.season.findFirstOrThrow({ where: { isActive: true } });
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
