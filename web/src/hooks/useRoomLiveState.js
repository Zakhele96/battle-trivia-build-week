import { useCallback, useEffect, useRef, useState } from "react";
import { createChatConnection } from "../services/chatConnection";
import {
  parseServerDate,
  normalizeSessionStatus,
} from "../components/trivia/triviaUtils";

import {
  getRoomSessionStatus,
  getWordScrambleSessionStatus,
  getWordScrambleState,
} from "../api/roomsApi";

function getFeedbackDurationMs(message) {
  const value = (message || "").toLowerCase();

  if (!value) return 0;
  if (value.includes("correct") || value.includes("points")) return 2600;
  if (value.includes("already answered correctly")) return 2800;
  if (value.includes("already solved")) return 2800;
  if (value.includes("slow down")) return 3200;
  if (value.includes("used all")) return 4200;

  return 3400;
}

export default function useRoomLiveState({
  roomId,
  token,
  room,
  onReceiveMessage,
  onMessageDeleted,
}) {
  const [status, setStatus] = useState("connecting");
  const [connectionError, setConnectionError] = useState("");

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentRoundId, setCurrentRoundId] = useState(null);
  const [currentRoundNumber, setCurrentRoundNumber] = useState(null);
  const [roundEndsAt, setRoundEndsAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [roundWinners, setRoundWinners] = useState([]);
  const [weeklyWinners, setWeeklyWinners] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [answerFeedback, setAnswerFeedback] = useState("");
  const [sessionStatus, setSessionStatus] = useState(null);
  const [playerRank, setPlayerRank] = useState(null);
  const [lastRoundPlacement, setLastRoundPlacement] = useState(null);
  const [liveStreak, setLiveStreak] = useState({
    current: 0,
    best: 0,
  });
  const [attemptsInfo, setAttemptsInfo] = useState({
    used: 0,
    left: null,
    max: null,
  });

  const [isQuestionFresh, setIsQuestionFresh] = useState(false);
  const [isRoundReveal, setIsRoundReveal] = useState(false);

  const [achievementUnlocks, setAchievementUnlocks] = useState([]);

  const [wordScrambleState, setWordScrambleState] = useState(null);
  const [wordScrambleStatus, setWordScrambleStatus] = useState(null);
  const [wordScrambleGuessFeedback, setWordScrambleGuessFeedback] =
    useState(null);

  const connectionRef = useRef(null);
  const onReceiveMessageRef = useRef(onReceiveMessage);
  const currentRoundIdRef = useRef(null);
  const lastRoundPlacementRef = useRef(null);
  const liveStreakRef = useRef({
    current: 0,
    best: 0,
  });
  const onMessageDeletedRef = useRef(onMessageDeleted);

  const isBattleTriviaRoom =
    room?.slug === "battle-trivia" || room?.roomType === "trivia";
  const isWordScrambleRoom = room?.slug === "word-scramble";

  const applyWordScrambleGuessPayload = useCallback(
    (payload, forceRejected = false) => {
      if (!payload) return;

      if (forceRejected || payload.success === false) {
        setWordScrambleGuessFeedback({
          ...payload,
          isCorrect: false,
          message: payload?.message || "Guess rejected.",
        });
        return;
      }

      if (payload?.alreadyAnsweredCorrectly) {
        setWordScrambleGuessFeedback({
          ...payload,
          isCorrect: true,
          message: payload?.message || "You already solved this round.",
        });
        return;
      }

      if (payload?.isCorrect) {
        setWordScrambleGuessFeedback({
          ...payload,
          isCorrect: true,
          message: payload?.message || "Correct guess!",
        });
        return;
      }

      setWordScrambleGuessFeedback({
        ...payload,
        isCorrect: false,
        message: payload?.message || "Incorrect guess.",
      });
    },
    []
  );

  useEffect(() => {
    onMessageDeletedRef.current = onMessageDeleted;
  }, [onMessageDeleted]);

  useEffect(() => {
    onReceiveMessageRef.current = onReceiveMessage;
  }, [onReceiveMessage]);

  useEffect(() => {
    currentRoundIdRef.current = currentRoundId;
  }, [currentRoundId]);

  useEffect(() => {
    lastRoundPlacementRef.current = lastRoundPlacement;
  }, [lastRoundPlacement]);

  useEffect(() => {
    liveStreakRef.current = liveStreak;
  }, [liveStreak]);

  useEffect(() => {
    if (achievementUnlocks.length === 0) return;

    const timer = window.setTimeout(() => {
      setAchievementUnlocks([]);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [achievementUnlocks]);

  useEffect(() => {
    if (!currentRoundId) return;

    setIsQuestionFresh(true);

    const timeoutId = window.setTimeout(() => {
      setIsQuestionFresh(false);
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentRoundId]);

  useEffect(() => {
    if (!correctAnswer) {
      setIsRoundReveal(false);
      return;
    }

    setIsRoundReveal(true);

    const timeoutId = window.setTimeout(() => {
      setIsRoundReveal(false);
    }, 1400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [correctAnswer]);

  useEffect(() => {
    if (!roundEndsAt) {
      setTimeLeft(0);
      return;
    }

    const updateTimeLeft = () => {
      const endsAtMs = roundEndsAt.getTime();
      const nowMs = Date.now();
      const seconds = Math.max(0, Math.ceil((endsAtMs - nowMs) / 1000));
      setTimeLeft(seconds);
    };

    updateTimeLeft();

    const intervalId = window.setInterval(updateTimeLeft, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [roundEndsAt]);

  useEffect(() => {
    if (!answerFeedback || !currentRoundId) return;

    const timeoutId = window.setTimeout(() => {
      setAnswerFeedback("");
    }, getFeedbackDurationMs(answerFeedback));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [answerFeedback, currentRoundId]);

  useEffect(() => {
    if (!wordScrambleGuessFeedback?.message || !wordScrambleState?.roundId)
      return;

    const timeoutId = window.setTimeout(() => {
      setWordScrambleGuessFeedback(null);
    }, getFeedbackDurationMs(wordScrambleGuessFeedback.message));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [wordScrambleGuessFeedback, wordScrambleState?.roundId]);

  useEffect(() => {
    setWordScrambleGuessFeedback(null);
  }, [wordScrambleState?.roundId]);

  useEffect(() => {
    if (!token || !roomId) return;

    let isCancelled = false;
    let joinedRoom = false;

    setStatus("connecting");
    setConnectionError("");
    setCurrentQuestion(null);
    setCurrentRoundId(null);
    setCurrentRoundNumber(null);
    setRoundEndsAt(null);
    setTimeLeft(0);
    setCorrectAnswer("");
    setRoundWinners([]);
    setWeeklyWinners(null);
    setLeaderboard([]);
    setAnswerFeedback("");
    setSessionStatus(null);
    setPlayerRank(null);
    setLastRoundPlacement(null);
    setWordScrambleState(null);
    setWordScrambleStatus(null);
    setWordScrambleGuessFeedback(null);
    setAchievementUnlocks([]);
    setLiveStreak({
      current: 0,
      best: 0,
    });
    setAttemptsInfo({
      used: 0,
      left: null,
      max: null,
    });
    setIsQuestionFresh(false);
    setIsRoundReveal(false);

    currentRoundIdRef.current = null;
    lastRoundPlacementRef.current = null;
    liveStreakRef.current = {
      current: 0,
      best: 0,
    };

    const connection = createChatConnection(token);
    connectionRef.current = connection;

    connection.on("ReceiveMessage", (message) => {
      if (isCancelled) return;
      onReceiveMessageRef.current?.(message);
    });

    connection.on("MessageDeleted", (payload) => {
      if (isCancelled) return;
      if (!payload?.messageId) return;

      onMessageDeletedRef.current?.(payload.messageId);
    });

    connection.on("AchievementsUnlocked", (payload) => {
      if (isCancelled) return;

      const achievements = Array.isArray(payload?.achievements)
        ? payload.achievements
        : [];

      if (achievements.length === 0) return;

      setAchievementUnlocks((prev) => [...prev, ...achievements]);
    });

    connection.on("QuestionStarted", (payload) => {
      if (isCancelled) return;

      const endsAt = parseServerDate(payload.endsAt);

      currentRoundIdRef.current = payload.roundId;
      lastRoundPlacementRef.current = null;

      setCurrentQuestion({
        questionText: payload.questionText,
        category: payload.category,
        difficulty: payload.difficulty,
      });
      setCurrentRoundId(payload.roundId);
      setCurrentRoundNumber(payload.roundNumber);
      setRoundEndsAt(endsAt);
      setCorrectAnswer("");
      setRoundWinners([]);
      setAnswerFeedback("");
      setLastRoundPlacement(null);
      setAttemptsInfo({
        used: 0,
        left: null,
        max: null,
      });

      setSessionStatus((prev) =>
        prev
          ? {
              ...prev,
              isLiveNow: true,
              hasActiveRound: true,
              currentRoundEndsAt: endsAt,
              statusText: "Live now",
            }
          : prev
      );
    });

    connection.on("RoundEnded", (payload) => {
      if (isCancelled) return;

      const hadCorrectResult = !!lastRoundPlacementRef.current?.wasCorrect;
      const streakBeforeBreak = liveStreakRef.current.current;

      if (!hadCorrectResult && streakBeforeBreak > 0) {
        const endedPlacement = {
          roundId: currentRoundIdRef.current,
          wasCorrect: false,
          streakEndedAt: streakBeforeBreak,
        };

        lastRoundPlacementRef.current = endedPlacement;
        setLastRoundPlacement(endedPlacement);

        const nextStreak = {
          current: 0,
          best: liveStreakRef.current.best,
        };

        liveStreakRef.current = nextStreak;
        setLiveStreak(nextStreak);
      }

      currentRoundIdRef.current = null;

      setCorrectAnswer(payload.correctAnswer || "");
      setTimeLeft(0);
      setRoundEndsAt(null);
      setCurrentRoundId(null);
      setAnswerFeedback("");

      setSessionStatus((prev) =>
        prev
          ? {
              ...prev,
              hasActiveRound: false,
              currentRoundEndsAt: null,
            }
          : prev
      );
    });

    connection.on("RoundWinners", (payload) => {
      if (isCancelled) return;
      setRoundWinners(Array.isArray(payload) ? payload : []);
    });

    connection.on("WeeklyWinnersAnnounced", (payload) => {
      if (isCancelled) return;
      setWeeklyWinners(payload || null);
    });

    connection.on("LeaderboardUpdated", (payload) => {
      if (isCancelled) return;
      setLeaderboard(Array.isArray(payload) ? payload : []);
    });

    connection.on("PlayerRankUpdated", (payload) => {
      if (isCancelled) return;
      setPlayerRank(payload || null);
    });

    connection.on("SessionStatusUpdated", (payload) => {
      if (isCancelled) return;
      setSessionStatus(normalizeSessionStatus(payload));
    });

    connection.on("AnswerChecked", (payload) => {
      if (isCancelled) return;

      if (typeof payload?.wrongAttemptsUsed === "number") {
        setAttemptsInfo({
          used: payload.wrongAttemptsUsed,
          left:
            typeof payload?.wrongAttemptsLeft === "number"
              ? payload.wrongAttemptsLeft
              : null,
          max:
            typeof payload?.maxWrongAttempts === "number"
              ? payload.maxWrongAttempts
              : null,
        });
      }

      if (payload?.alreadyAnsweredCorrectly) {
        setAnswerFeedback(payload.message || "You already answered correctly.");
        return;
      }

      if (payload?.isCorrect) {
        const rankText = payload.correctRank ? ` (#${payload.correctRank})` : "";
        const pointsText = payload.pointsAwarded
          ? ` +${payload.pointsAwarded} points${rankText}`
          : "";

        const nextCurrentStreak = liveStreakRef.current.current + 1;
        const nextBestStreak = Math.max(
          liveStreakRef.current.best,
          nextCurrentStreak
        );

        const nextStreak = {
          current: nextCurrentStreak,
          best: nextBestStreak,
        };

        liveStreakRef.current = nextStreak;
        setLiveStreak(nextStreak);

        const placement = {
          roundId: payload.roundId ?? currentRoundIdRef.current,
          placement: payload.correctRank ?? null,
          pointsAwarded: payload.pointsAwarded ?? 0,
          wasCorrect: true,
          streakAfterRound: nextCurrentStreak,
        };

        lastRoundPlacementRef.current = placement;
        setLastRoundPlacement(placement);

        setAnswerFeedback(payload.message || `Correct!${pointsText}`);
      } else {
        setAnswerFeedback(payload?.message || "Incorrect answer.");
      }
    });

    connection.on("AnswerRejected", (payload) => {
      if (isCancelled) return;

      if (typeof payload?.wrongAttemptsUsed === "number") {
        setAttemptsInfo({
          used: payload.wrongAttemptsUsed,
          left:
            typeof payload?.wrongAttemptsLeft === "number"
              ? payload.wrongAttemptsLeft
              : null,
          max:
            typeof payload?.maxWrongAttempts === "number"
              ? payload.maxWrongAttempts
              : null,
        });
      }

      setAnswerFeedback(payload?.message || "Answer rejected.");
    });

    connection.on("WordScrambleStateChanged", (payload) => {
      if (isCancelled) return;
      setWordScrambleState(payload || null);
    });

    connection.on("WordScrambleSessionStatusChanged", (payload) => {
      if (isCancelled) return;
      setWordScrambleStatus(payload || null);
    });

    connection.on("WordScrambleGuessChecked", (payload) => {
      if (isCancelled) return;
      applyWordScrambleGuessPayload(payload, false);
    });

    connection.on("WordScrambleGuessRejected", (payload) => {
      if (isCancelled) return;
      applyWordScrambleGuessPayload(payload, true);
    });

    connection.onreconnecting(() => {
      if (!isCancelled) {
        setStatus("reconnecting");
      }
    });

    connection.onreconnected(async () => {
      if (isCancelled) return;

      try {
        await connection.invoke("JoinRoom", roomId);
        joinedRoom = true;

        if (!isCancelled) {
          setStatus("connected");
          setConnectionError("");
        }
      } catch {
        if (!isCancelled) {
          setStatus("error");
          setConnectionError("Reconnected, but failed to rejoin room.");
        }
      }
    });

    connection.onclose(() => {
      if (!isCancelled) {
        setStatus("disconnected");
      }
    });

    const startPromise = (async () => {
      try {
        await connection.start();

        if (isCancelled) return;

        await connection.invoke("JoinRoom", roomId);
        joinedRoom = true;

        if (!isCancelled) {
          setStatus("connected");
          setConnectionError("");
        }
      } catch (err) {
        if (!isCancelled) {
          setStatus("error");
          setConnectionError("Failed to connect to live chat.");
          console.error(err);
        }
      }
    })();

    return () => {
      isCancelled = true;
      connectionRef.current = null;

      Promise.resolve()
        .then(async () => {
          await startPromise.catch(() => {});

          try {
            if (joinedRoom && connection.state === "Connected") {
              await connection.invoke("LeaveRoom", roomId);
            }
          } catch {}

          try {
            if (connection.state !== "Disconnected") {
              await connection.stop();
            }
          } catch {}
        })
        .catch(() => {});
    };
  }, [roomId, token, applyWordScrambleGuessPayload]);

  useEffect(() => {
    if (!roomId || !room || status !== "connected") return;

    let isCancelled = false;

    async function loadModeState() {
      try {
        if (isBattleTriviaRoom) {
          const data = await getRoomSessionStatus(roomId);
          if (isCancelled) return;
          setSessionStatus(normalizeSessionStatus(data));
          return;
        }

        if (isWordScrambleRoom) {
          const [scrambleStatus, scrambleState] = await Promise.all([
            getWordScrambleSessionStatus(roomId).catch(() => null),
            getWordScrambleState(roomId).catch(() => null),
          ]);

          if (isCancelled) return;

          setWordScrambleStatus(scrambleStatus);
          setWordScrambleState(scrambleState);
        }
      } catch {}
    }

    loadModeState();

    return () => {
      isCancelled = true;
    };
  }, [roomId, room, status, isBattleTriviaRoom, isWordScrambleRoom]);

  const sendRoomPayload = useCallback(
    async (text, mode) => {
      const connection = connectionRef.current;

      if (!connection || status !== "connected") {
        throw new Error("Chat is not connected.");
      }

      if (mode === "battle-trivia") {
        await connection.invoke("SubmitAnswer", roomId, text);
        return true;
      }

      if (mode === "word-scramble") {
        const result = await connection.invoke(
          "SubmitWordScrambleGuess",
          roomId,
          text
        );

        if (result && typeof result === "object") {
          applyWordScrambleGuessPayload(result, result.success === false);
        }

        return result ?? true;
      }

      await connection.invoke("SendMessage", roomId, text);
      return true;
    },
    [roomId, status, applyWordScrambleGuessPayload]
  );

  return {
    status,
    connectionError,
    currentQuestion,
    currentRoundId,
    currentRoundNumber,
    timeLeft,
    correctAnswer,
    roundWinners,
    weeklyWinners,
    leaderboard,
    answerFeedback,
    sessionStatus,
    playerRank,
    lastRoundPlacement,
    liveStreak,
    attemptsInfo,
    isQuestionFresh,
    isRoundReveal,
    sendRoomPayload,
    achievementUnlocks,
    wordScrambleState,
    wordScrambleStatus,
    wordScrambleGuessFeedback,
  };
}