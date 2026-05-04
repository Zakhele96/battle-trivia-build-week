const CACHE_PREFIX = "bts_lobby_dashboard_v2_";
const SLICE_MAX_AGE_MS = {
  battleTriviaBoardRows: 20 * 1000,
  profileOverview: 5 * 60 * 1000,
  recentResult: 2 * 60 * 1000,
};

function getCacheKey(userId, slice) {
  return userId ? `${CACHE_PREFIX}${userId}_${slice}` : "";
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function applyPodiumProfileUpdate(currentPodium, profileUpdate) {
  if (
    !currentPodium ||
    !Array.isArray(currentPodium.winners) ||
    currentPodium.winners.length === 0 ||
    !profileUpdate?.userId
  ) {
    return currentPodium;
  }

  let changed = false;
  const nextWinners = currentPodium.winners.map((winner) => {
    if (winner?.userId !== profileUpdate.userId) {
      return winner;
    }

    changed = true;
    return {
      ...winner,
      avatarUrl: profileUpdate.avatarUrl ?? null,
      displayName: profileUpdate.displayName || winner.displayName,
      username: profileUpdate.username || winner.username,
    };
  });

  return changed
    ? {
        ...currentPodium,
        winners: nextWinners,
      }
    : currentPodium;
}

export function readLobbyDashboardSlice(userId, slice) {
  if (!userId || !slice) return { payload: null, isFresh: false };

  try {
    if (slice === "sessionPodium") {
      localStorage.removeItem(getCacheKey(userId, slice));
      return { payload: null, isFresh: false };
    }

    const raw = localStorage.getItem(getCacheKey(userId, slice));
    if (!raw) {
      return { payload: null, isFresh: false };
    }

    const parsed = safeParse(raw);
    if (!parsed || !("payload" in parsed) || !parsed.savedAt) {
      return { payload: null, isFresh: false };
    }

    const maxAge = SLICE_MAX_AGE_MS[slice] ?? 60 * 1000;
    const isFresh = Date.now() - Number(parsed.savedAt) <= maxAge;

    return {
      payload: parsed.payload ?? null,
      isFresh,
    };
  } catch {
    return { payload: null, isFresh: false };
  }
}

export function writeLobbyDashboardSlice(userId, slice, payload) {
  if (!userId || !slice) return;

  try {
    const key = getCacheKey(userId, slice);
    if (slice === "sessionPodium") {
      localStorage.removeItem(key);
      return;
    }

    const nextSerialized = JSON.stringify(payload ?? null);
    const currentRaw = localStorage.getItem(key);

    if (currentRaw) {
      const currentParsed = safeParse(currentRaw);
      const currentSerialized = JSON.stringify(currentParsed?.payload ?? null);
      if (currentSerialized === nextSerialized) {
        return;
      }
    }

    localStorage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        payload: payload ?? null,
      })
    );
  } catch {
    // ignore cache write errors
  }
}

export function updateLobbyDashboardSlice(userId, slice, updater) {
  if (!userId || !slice || typeof updater !== "function") return;

  try {
    const key = getCacheKey(userId, slice);
    const currentRaw = localStorage.getItem(key);
    const currentParsed = currentRaw ? safeParse(currentRaw) : null;
    const currentPayload =
      currentParsed && "payload" in currentParsed ? currentParsed.payload ?? null : null;
    const nextPayload = updater(currentPayload);

    if (typeof nextPayload === "undefined") {
      return;
    }

    writeLobbyDashboardSlice(userId, slice, nextPayload);
  } catch {
    // ignore cache update errors
  }
}
