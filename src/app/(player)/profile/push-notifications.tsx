"use client";

import { useEffect, useState } from "react";
import { subscribePush, unsubscribePush } from "./push-actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- rilevamento del supporto browser disponibile solo lato client, non c'è modo di farlo nel lazy initializer senza mismatch di idratazione.
    setIsSupported(true);

    (async () => {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    })();
  }, []);

  async function subscribe() {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });
      await subscribePush(JSON.parse(JSON.stringify(sub)));
      setSubscription(sub);
    } finally {
      setPending(false);
    }
  }

  async function unsubscribe() {
    if (!subscription) return;
    setPending(true);
    try {
      await unsubscribePush(subscription.endpoint);
      await subscription.unsubscribe();
      setSubscription(null);
    } finally {
      setPending(false);
    }
  }

  if (!isSupported) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface shadow-card p-4">
      <h2 className="font-medium text-heading">Notifiche push</h2>
      <p className="text-xs text-zinc-500">
        Ricevi un avviso sul telefono/computer quando manca il pronostico per una
        partita in scadenza, oltre alla mail.
      </p>
      <button
        type="button"
        onClick={subscription ? unsubscribe : subscribe}
        disabled={pending}
        className="self-start rounded-xl bg-inter-navy px-4 py-2.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-inter-navy-light hover:shadow-md active:scale-[0.98] disabled:opacity-50"
      >
        {pending
          ? "Attendere…"
          : subscription
            ? "Disattiva notifiche"
            : "Attiva notifiche"}
      </button>
    </div>
  );
}
