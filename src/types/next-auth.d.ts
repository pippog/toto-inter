import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PLAYER" | "ADMIN";
      status: "INVITED" | "ACTIVE" | "DISABLED";
    } & DefaultSession["user"];
  }

  interface User {
    role: "PLAYER" | "ADMIN";
    status: "INVITED" | "ACTIVE" | "DISABLED";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "PLAYER" | "ADMIN";
    status: "INVITED" | "ACTIVE" | "DISABLED";
  }
}
