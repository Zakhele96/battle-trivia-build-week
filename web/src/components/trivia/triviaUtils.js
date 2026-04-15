export function parseServerDate(value) {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value === "string") {
    const hasTimezone = /z$|[+-]\d{2}:\d{2}$/i.test(value);
    return new Date(hasTimezone ? value : `${value}Z`);
  }

  return new Date(value);
}

export function normalizeSessionStatus(payload) {
  if (!payload) return null;

  return {
    ...payload,
    periodStart: parseServerDate(payload.periodStart),
    periodEnd: parseServerDate(payload.periodEnd),
    currentWindowEnd: parseServerDate(payload.currentWindowEnd),
    nextWindowStart: parseServerDate(payload.nextWindowStart),
    currentRoundEndsAt: parseServerDate(payload.currentRoundEndsAt),
  };
}

export function formatWindowTime(value) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  return new Intl.DateTimeFormat(
    undefined,
    sameDay
      ? { hour: "2-digit", minute: "2-digit" }
      : { weekday: "short", hour: "2-digit", minute: "2-digit" }
  ).format(date);
}

export function getSessionLabel(sessionStatus) {
  if (!sessionStatus) return "Loading session...";

  if (sessionStatus.isLiveNow) {
    if (
      sessionStatus.runMode === "scheduled" &&
      sessionStatus.currentWindowEnd
    ) {
      return `Live until ${formatWindowTime(sessionStatus.currentWindowEnd)}`;
    }

    return "Live now";
  }

  if (
    sessionStatus.runMode === "scheduled" &&
    sessionStatus.nextWindowStart
  ) {
    return `Next live window: ${formatWindowTime(sessionStatus.nextWindowStart)}`;
  }

  return sessionStatus.statusText || "Waiting";
}