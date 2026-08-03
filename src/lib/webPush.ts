import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/db";

webpush.setVapidDetails(
  "mailto:filogori@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
      );
    } catch (error) {
      // 404/410: il push service ha revocato/scartato la subscription (utente ha
      // disinstallato l'app, revocato il permesso, ecc.) — va ripulita dal DB,
      // altrimenti ci riproviamo a ogni invio all'infinito.
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      } else {
        console.error(`sendPushToUser: invio a subscription ${sub.id} fallito:`, error);
      }
    }
  }
}
