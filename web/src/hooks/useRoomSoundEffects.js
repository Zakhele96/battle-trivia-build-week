import { useCallback, useEffect, useRef } from "react";
import { useSoundPreferences } from "./useSoundPreferences";

function getAudioContextConstructor() {
  if (typeof window === "undefined") return null;

  return window.AudioContext || window.webkitAudioContext || null;
}

function createTone(context, options) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = options.type || "sine";
  oscillator.frequency.setValueAtTime(
    options.frequency,
    options.startTime
  );

  gainNode.gain.setValueAtTime(0.0001, options.startTime);
  gainNode.gain.exponentialRampToValueAtTime(
    options.volume,
    options.startTime + 0.02
  );
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    options.startTime + options.duration
  );

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(options.startTime);
  oscillator.stop(options.startTime + options.duration + 0.03);
}

function playLayeredTone(context, layers) {
  layers.forEach((layer) => {
    createTone(context, layer);
  });
}

export default function useRoomSoundEffects({
  isChatRoom,
  isBattleTrivia,
  isWordScramble,
  currentRoundId,
  roundEndsAt,
  timeLeft,
  lastRoundPlacement,
  mentionToasts,
  wordScrambleState,
  wordScrambleGuessFeedback,
}) {
  const { soundEffectsEnabled, timerWarningsEnabled } = useSoundPreferences();

  const audioContextRef = useRef(null);
  const isAudioUnlockedRef = useRef(false);
  const playedBattleCorrectKeyRef = useRef("");
  const playedScrambleCorrectKeyRef = useRef("");
  const playedMentionKeyRef = useRef("");
  const playedTimerCueKeysRef = useRef(new Set());

  const ensureAudioContext = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current;

    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) return null;

    try {
      audioContextRef.current = new AudioContextConstructor();
      return audioContextRef.current;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const unlockAudio = async () => {
      const context = ensureAudioContext();
      if (!context) return;

      try {
        if (context.state !== "running") {
          await context.resume();
        }

        isAudioUnlockedRef.current = context.state === "running";
      } catch {
        // ignore audio unlock failures
      }
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, [ensureAudioContext]);

  const playCorrectAnswerChime = useCallback(() => {
    if (!soundEffectsEnabled) return;

    const context = ensureAudioContext();
    if (!context || !isAudioUnlockedRef.current) return;

    const startTime = context.currentTime + 0.01;

    playLayeredTone(context, [
      {
        startTime,
        frequency: 523.25,
        duration: 0.12,
        volume: 0.034,
        type: "sine",
      },
      {
        startTime,
        frequency: 659.25,
        duration: 0.18,
        volume: 0.03,
        type: "triangle",
      },
      {
        startTime: startTime + 0.12,
        frequency: 783.99,
        duration: 0.22,
        volume: 0.03,
        type: "triangle",
      },
      {
        startTime: startTime + 0.26,
        frequency: 1046.5,
        duration: 0.42,
        volume: 0.028,
        type: "sine",
      },
    ]);
  }, [ensureAudioContext, soundEffectsEnabled]);

  const playTimerWarning = useCallback(
    (secondsRemaining) => {
      if (!soundEffectsEnabled || !timerWarningsEnabled) return;

      const context = ensureAudioContext();
      if (!context || !isAudioUnlockedRef.current) return;

      const startTime = context.currentTime + 0.01;
      const isUrgent = secondsRemaining <= 3;

      if (isUrgent) {
        playLayeredTone(context, [
          {
            startTime,
            frequency: 659.25,
            duration: 0.11,
            volume: 0.03,
            type: "triangle",
          },
          {
            startTime: startTime + 0.14,
            frequency: 830.61,
            duration: 0.15,
            volume: 0.034,
            type: "triangle",
          },
        ]);
        return;
      }

      playLayeredTone(context, [
        {
          startTime,
          frequency: 587.33,
          duration: 0.1,
          volume: 0.024,
          type: "sine",
        },
        {
          startTime,
          frequency: 698.46,
          duration: 0.1,
          volume: 0.018,
          type: "triangle",
        },
      ]);
    },
    [ensureAudioContext, soundEffectsEnabled, timerWarningsEnabled]
  );

  const playMentionPing = useCallback(() => {
    if (!soundEffectsEnabled) return;

    const context = ensureAudioContext();
    if (!context || !isAudioUnlockedRef.current) return;

    const startTime = context.currentTime + 0.01;

    createTone(context, {
      startTime,
      frequency: 523.25,
      duration: 0.08,
      volume: 0.028,
      type: "sine",
    });

    createTone(context, {
      startTime: startTime + 0.1,
      frequency: 659.25,
      duration: 0.14,
      volume: 0.03,
      type: "triangle",
    });
  }, [ensureAudioContext, soundEffectsEnabled]);

  useEffect(() => {
    if (!isBattleTrivia) return;

    if (!lastRoundPlacement?.wasCorrect || !lastRoundPlacement?.roundId) return;

    const key = `battle-correct:${lastRoundPlacement.roundId}`;
    if (playedBattleCorrectKeyRef.current === key) return;

    playedBattleCorrectKeyRef.current = key;
    playCorrectAnswerChime();
  }, [isBattleTrivia, lastRoundPlacement, playCorrectAnswerChime]);

  useEffect(() => {
    if (!isWordScramble) return;
    if (!wordScrambleGuessFeedback?.isCorrect) return;
    if (!wordScrambleState?.roundId) return;

    const key = `scramble-correct:${wordScrambleState.roundId}`;
    if (playedScrambleCorrectKeyRef.current === key) return;

    playedScrambleCorrectKeyRef.current = key;
    playCorrectAnswerChime();
  }, [
    isWordScramble,
    playCorrectAnswerChime,
    wordScrambleGuessFeedback?.isCorrect,
    wordScrambleState?.roundId,
  ]);

  useEffect(() => {
    if (!soundEffectsEnabled || !timerWarningsEnabled) return;
    if (!isBattleTrivia || !currentRoundId || !roundEndsAt) return;

    const endsAtMs =
      roundEndsAt instanceof Date
        ? roundEndsAt.getTime()
        : new Date(roundEndsAt).getTime();

    if (!Number.isFinite(endsAtMs)) return;

    const warningSeconds = [5, 3, 1];
    const timerIds = [];

    warningSeconds.forEach((secondsRemaining) => {
      const key = `battle-timer:${currentRoundId}:${secondsRemaining}`;
      if (playedTimerCueKeysRef.current.has(key)) return;

      const fireAtMs = endsAtMs - secondsRemaining * 1000;
      const delayMs = fireAtMs - Date.now();

      if (delayMs <= 0) return;

      const timerId = window.setTimeout(() => {
        if (playedTimerCueKeysRef.current.has(key)) return;

        playedTimerCueKeysRef.current.add(key);
        playTimerWarning(secondsRemaining);
      }, delayMs);

      timerIds.push(timerId);
    });

    return () => {
      timerIds.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [
    currentRoundId,
    isBattleTrivia,
    playTimerWarning,
    roundEndsAt,
    soundEffectsEnabled,
    timerWarningsEnabled,
  ]);

  useEffect(() => {
    if (!soundEffectsEnabled || !timerWarningsEnabled) return;

    const warningSeconds =
      wordScrambleState?.timeLeft === 5 ||
      wordScrambleState?.timeLeft === 3 ||
      wordScrambleState?.timeLeft === 1
        ? wordScrambleState.timeLeft
        : null;

    if (
      !isWordScramble ||
      wordScrambleState?.phase !== "active" ||
      !wordScrambleState?.roundId ||
      !warningSeconds
    ) {
      return;
    }

    const key = `scramble-timer:${wordScrambleState.roundId}:${warningSeconds}`;
    if (playedTimerCueKeysRef.current.has(key)) return;

    playedTimerCueKeysRef.current.add(key);
    playTimerWarning(warningSeconds);
  }, [
    isWordScramble,
    playTimerWarning,
    soundEffectsEnabled,
    timerWarningsEnabled,
    wordScrambleState?.phase,
    wordScrambleState?.roundId,
    wordScrambleState?.timeLeft,
  ]);

  useEffect(() => {
    if (!isChatRoom || !Array.isArray(mentionToasts) || mentionToasts.length === 0) {
      return;
    }

    const latestMention = mentionToasts[mentionToasts.length - 1];
    if (!latestMention?.id) return;

    const key = `mention:${latestMention.id}`;
    if (playedMentionKeyRef.current === key) return;

    playedMentionKeyRef.current = key;
    playMentionPing();
  }, [isChatRoom, mentionToasts, playMentionPing]);
}
