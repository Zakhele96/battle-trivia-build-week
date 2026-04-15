import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ANALYTICS_BASE_URL = `${API_BASE_URL}/analytics`;

function getSessionId() {
  const key = "analytics_session_id";
  let value = localStorage.getItem(key);

  if (!value) {
    value =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(key, value);
  }

  return value;
}

function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return null;

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      value == null ? "" : String(value),
    ])
  );
}

function buildPayload(event) {
  return {
    eventName: event.eventName,
    pageType: event.pageType || null,
    pageSlug: event.pageSlug || null,
    category: event.category || null,
    label: event.label || null,
    path:
      event.path ||
      (typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : null),
    referrer:
      event.referrer ||
      (typeof document !== "undefined" ? document.referrer || null : null),
    sessionId: event.sessionId || getSessionId(),
    metadata: normalizeMetadata(event.metadata),
  };
}

export async function trackEvent(event) {
  const payload = buildPayload(event);
  const url = `${ANALYTICS_BASE_URL}/events`;

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });

      const sent = navigator.sendBeacon(url, blob);
      if (sent) return true;
    }
  } catch {
    // fall through to fetch
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    return true;
  } catch (error) {
    console.error("Failed to track analytics event:", error);
    return false;
  }
}

export async function trackOncePerSession(key, event) {
  const storageKey = `analytics_once_${key}`;

  try {
    if (sessionStorage.getItem(storageKey) === "1") {
      return false;
    }

    const ok = await trackEvent(event);

    if (ok) {
      sessionStorage.setItem(storageKey, "1");
    }

    return ok;
  } catch (error) {
    console.error("Failed to track once-per-session event:", error);
    return false;
  }
}

export async function getAnalyticsSummary(days = 30) {
  const response = await axios.get(`${ANALYTICS_BASE_URL}/summary`, {
    params: { days },
    withCredentials: true,
  });

  return response.data;
}