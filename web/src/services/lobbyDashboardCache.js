const CACHE_PREFIX = "bts_lobby_dashboard_v2_";

const SLICE_MAX_AGE_MS = {
  sessionPodium: 24 * 60 * 60 * 1000,
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

export function readLobbyDashboardSlice(userId, slice) {
  if (!userId || !slice) return { payload: null, isFresh: false };

  try {
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
