"use server";

import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/db";

type SerializedPushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function subscribePush(sub: SerializedPushSubscription) {
  const user = await getCurrentUser();

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { userId: user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    create: {
      userId: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  });

  return { success: true };
}

export async function unsubscribePush(endpoint: string) {
  await getCurrentUser();
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return { success: true };
}
