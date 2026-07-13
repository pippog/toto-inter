import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Controllo ottimistico basato solo sul cookie di sessione (edge-safe, niente
// accesso al DB): protegge le rotte a livello di navigazione. L'autorizzazione
// reale (incluso lo stato ACTIVE/DISABLED dell'utente) viene sempre
// riverificata lato server nel DAL per ogni pagina/Server Action — vedi
// src/lib/dal.ts.
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
