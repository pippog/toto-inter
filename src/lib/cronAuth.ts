import "server-only";

// Protegge gli endpoint /api/cron/*: stesso schema che usa Vercel Cron
// quando è impostata la env var CRON_SECRET (header Authorization: Bearer
// <secret>), cosi lo stesso segreto protegge sia il cron nativo Vercel
// (discovery, 1 volta/giorno su Hobby) sia il trigger esterno GitHub
// Actions (sync risultati, ogni ora — Vercel Hobby non permette cron più
// frequenti di 1/giorno).
export function isAuthorizedCronRequest(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}
