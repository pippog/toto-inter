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
    redirect("/matches");
  }
  return user;
});
