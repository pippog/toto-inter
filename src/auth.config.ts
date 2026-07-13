import type { NextAuthConfig } from "next-auth";

// Config "edge-safe": nessun provider Node-only (Credentials + bcrypt + Prisma
// vivono solo in auth.ts). Usata dal proxy per i controlli ottimistici di
// route protection; l'autorizzazione reale (incluso lo stato utente) va
// sempre riverificata lato server nel DAL, mai fidandosi solo di questo.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      // Controllo ottimistico: solo "l'utente ha una sessione?". Il
      // controllo di ruolo (es. solo ADMIN su /admin) e la riverifica dello
      // stato utente vivono nel DAL (requireAdmin/getCurrentUser), più
      // vicino ai dati, così un non-admin loggato viene rimandato a
      // /matches invece che a /login (vedi guida Next.js su Proxy).
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isProtectedRoute =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/matches") ||
        pathname.startsWith("/leaderboard") ||
        pathname.startsWith("/profile");

      if (isProtectedRoute) {
        return isLoggedIn;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "PLAYER" | "ADMIN";
        session.user.status = token.status as
          | "INVITED"
          | "ACTIVE"
          | "DISABLED";
      }
      return session;
    },
  },
};
