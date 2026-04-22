import { useCallback, useEffect, useMemo, useState } from "react";

const SOUND_PREFERENCES_KEY = "bts_sound_preferences";

const DEFAULT_PREFERENCES = {
  soundEffectsEnabled: true,
  timerWarningsEnabled: true,
};

function getStoredSoundPreferences() {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw = localStorage.getItem(SOUND_PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;

    const parsed = JSON.parse(raw);

    return {
      soundEffectsEnabled:
        typeof parsed?.soundEffectsEnabled === "boolean"
          ? parsed.soundEffectsEnabled
          : DEFAULT_PREFERENCES.soundEffectsEnabled,
      timerWarningsEnabled:
        typeof parsed?.timerWarningsEnabled === "boolean"
          ? parsed.timerWarningsEnabled
          : DEFAULT_PREFERENCES.timerWarningsEnabled,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function useSoundPreferences() {
  const [preferences, setPreferences] = useState(getStoredSoundPreferences);

  useEffect(() => {
    try {
      localStorage.setItem(
        SOUND_PREFERENCES_KEY,
        JSON.stringify(preferences)
      );
    } catch {
      // ignore storage failures
    }
  }, [preferences]);

  const setSoundEffectsEnabled = useCallback((value) => {
    setPreferences((prev) => ({
      ...prev,
      soundEffectsEnabled: Boolean(value),
    }));
  }, []);

  const setTimerWarningsEnabled = useCallback((value) => {
    setPreferences((prev) => ({
      ...prev,
      timerWarningsEnabled: Boolean(value),
    }));
  }, []);

  return useMemo(
    () => ({
      ...preferences,
      setSoundEffectsEnabled,
      setTimerWarningsEnabled,
    }),
    [preferences, setSoundEffectsEnabled, setTimerWarningsEnabled]
  );
}
