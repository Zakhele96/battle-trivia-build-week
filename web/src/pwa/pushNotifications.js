import api from "../api/axios";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

function getSubscriptionPayload(subscription) {
  const json = subscription?.toJSON?.();
  return {
    endpoint: json?.endpoint || subscription?.endpoint || "",
    p256dh: json?.keys?.p256dh || "",
    auth: json?.keys?.auth || "",
  };
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function getPushConfig() {
  const { data } = await api.get("/push-notifications/config");
  return data;
}

export async function syncPushSubscriptionIfEnabled() {
  if (!isPushSupported() || Notification.permission !== "granted") {
    return { synced: false, reason: "permission-not-granted" };
  }

  const config = await getPushConfig();
  if (!config?.isConfigured || !config?.publicKey) {
    return { synced: false, reason: "not-configured" };
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey),
    });
  }

  await api.post("/push-notifications/subscriptions", getSubscriptionPayload(subscription));
  return { synced: true, permission: Notification.permission };
}

export async function enablePushNotifications() {
  if (!isPushSupported()) {
    return { enabled: false, reason: "unsupported" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { enabled: false, reason: permission };
  }

  await syncPushSubscriptionIfEnabled();
  return { enabled: true, reason: "granted" };
}

export async function disablePushNotifications() {
  if (!isPushSupported()) {
    return { disabled: false, reason: "unsupported" };
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return { disabled: true, reason: "no-subscription" };
  }

  await api.post(
    "/push-notifications/subscriptions/delete",
    getSubscriptionPayload(subscription)
  );
  await subscription.unsubscribe().catch(() => null);
  return { disabled: true, reason: "removed" };
}
