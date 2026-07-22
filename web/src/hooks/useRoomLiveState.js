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
import { getBattleItState } from "../api/battleItApi";

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
  onMessageUpdated,
  onMessageReactionUpdated,
  onMessagePinned,
  onMessageUnpinned,
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
  const [answerResult, setAnswerResult] = useState(null);
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
  const [arenaActivityVersion, setArenaActivityVersion] = useState(0);
  const [arenaNotice, setArenaNotice] = useState(null);
  const [battleItState, setBattleItState] = useState(null);
  const [battleItHalftime, setBattleItHalftime] = useState(null);
  const [battleItCompleted, setBattleItCompleted] = useState(null);

  const connectionRef = useRef(null);
  const onReceiveMessageRef = useRef(onReceiveMessage);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const onMessageUpdatedRef = useRef(onMessageUpdated);
  const onMessageReactionUpdatedRef = useRef(onMessageReactionUpdated);
  const onMessagePinnedRef = useRef(onMessagePinned);
  const onMessageUnpinnedRef = useRef(onMessageUnpinned);

  const currentRoundIdRef = useRef(null);
  const lastRoundPlacementRef = useRef(null);
  const liveStreakRef = useRef({
    current: 0,
    best: 0,
  });

  const isBattleTriviaRoom =
    room?.slug === "battle-trivia" || room?.roomType === "trivia";
  const isBattleItRoom = room?.slug === "battle-it";
  const isWordScrambleRoom = room?.slug === "word-scramble";

  useEffect(() => {
    if (!wordScrambleState?.endsAt || wordScrambleState?.phase !== "active") {
      setWordScrambleState((prev) => {
        if (!prev || prev.timeLeft === 0) return prev;
        return {
          ...prev,
          timeLeft: 0,
        };
      });
      return undefined;
    }

    const endsAt = parseServerDate(wordScrambleState.endsAt);
    if (!(endsAt instanceof Date) || Number.isNaN(endsAt.getTime())) {
      return undefined;
    }

    const updateTimeLeft = () => {
      const seconds = Math.max(
        0,
        Math.ceil((endsAt.getTime() - Date.now()) / 1000)
      );

      setWordScrambleState((prev) => {
        if (!prev || prev.phase !== "active") return prev;
        if (prev.timeLeft === seconds) return prev;

        return {
          ...prev,
          timeLeft: seconds,
        };
      });
    };

    const intervalId = window.setInterval(updateTimeLeft, 250);
    updateTimeLeft();

    return () => window.clearInterval(intervalId);
  }, [wordScrambleState?.endsAt, wordScrambleState?.phase]);

  const applyWordScrambleGuessPayload = useCallback(
    (payload, forceRejected = false) => {
      if (!payload) return;

      if (payload?.playerStats) {
        setWordScrambleState((prev) =>
          prev
            ? {
                ...prev,
                playerStats: payload.playerStats,
              }
            : prev
        );
      }

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
    onReceiveMessageRef.current = onReceiveMessage;
  }, [onReceiveMessage]);

  useEffect(() => {
    onMessageDeletedRef.current = onMessageDeleted;
  }, [onMessageDeleted]);

  useEffect(() => {
    onMessageUpdatedRef.current = onMessageUpdated;
  }, [onMessageUpdated]);

  useEffect(() => {
    onMessageReactionUpdatedRef.current = onMessageReactionUpdated;
  }, [onMessageReactionUpdated]);

  useEffect(() => {
    onMessagePinnedRef.current = onMessagePinned;
  }, [onMessagePinned]);

  useEffect(() => {
    onMessageUnpinnedRef.current = onMessageUnpinned;
  }, [onMessageUnpinned]);

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

    let timeoutId = null;

    const updateTimeLeft = () => {
      const endsAtMs = roundEndsAt.getTime();
      const nowMs = Date.now();
      const msRemaining = Math.max(0, endsAtMs - nowMs);
      const seconds = Math.max(0, Math.ceil(msRemaining / 1000));
      setTimeLeft(seconds);

      if (msRemaining <= 0) {
        return;
      }

      const nextBoundaryDelay = msRemaining % 1000 || 1000;
      timeoutId = window.setTimeout(
        updateTimeLeft,
        Math.max(24, nextBoundaryDelay)
      );
    };

    updateTimeLeft();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
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
    setAnswerResult(null);
    setSessionStatus(null);
    setPlayerRank(null);
    setLastRoundPlacement(null);
    setWordScrambleState(null);
    setWordScrambleStatus(null);
    setWordScrambleGuessFeedback(null);
    setArenaNotice(null);
    setBattleItState(null);
    setBattleItHalftime(null);
    setBattleItCompleted(null);
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

    connection.on("MessageUpdated", (payload) => {
      if (isCancelled) return;
      onMessageUpdatedRef.current?.(payload);
    });

    connection.on("MessageReactionUpdated", (payload) => {
      if (isCancelled) return;
      onMessageReactionUpdatedRef.current?.(payload);
    });

    connection.on("MessagePinned", (payload) => {
      if (isCancelled) return;
      onMessagePinnedRef.current?.(payload);
    });

    connection.on("MessageUnpinned", (payload) => {
      if (isCancelled) return;
      onMessageUnpinnedRef.current?.(payload);
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
        roundId: payload.roundId,
        questionText: payload.questionText,
        questionImageUrl: payload.questionImageUrl || "",
        category: payload.category,
        difficulty: payload.difficulty,
        totalQuestions: payload.totalQuestions ?? null,
        sessionTitle: payload.sessionTitle || "",
        answerMode: payload.answerMode || "text",
        answerOptions: Array.isArray(payload.answerOptions)
          ? payload.answerOptions
          : [],
      });
      setCurrentRoundId(payload.roundId);
      setCurrentRoundNumber(payload.roundNumber);
      setRoundEndsAt(endsAt);
      setCorrectAnswer("");
      setRoundWinners([]);
      setAnswerFeedback("");
      setAnswerResult(null);
      setLastRoundPlacement(null);
      setAttemptsInfo({
        used: 0,
        left: null,
        max: null,
      });
      setBattleItHalftime(null);

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
      setCurrentQuestion((prev) =>
        prev
          ? {
              ...prev,
              roundId: payload.roundId || prev.roundId,
              answerImageUrl: payload.answerImageUrl || "",
              answerExplanation: payload.answerExplanation || "",
              sourceExcerpt: payload.sourceExcerpt || "",
              concept: payload.concept || prev.concept || prev.category || "",
              totalQuestions:
                payload.totalQuestions ?? prev.totalQuestions ?? null,
            }
          : prev
      );
      setTimeLeft(0);
      setRoundEndsAt(null);
      setCurrentRoundId(null);
      setAnswerFeedback("");
      setAnswerResult(null);

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

    const refreshBattleItState = async () => {
      try {
        const nextState = await getBattleItState(roomId);
        if (!isCancelled) setBattleItState(nextState || null);
      } catch {
        // The room remains usable if a transient Battle It refresh fails.
      }
    };

    connection.on("BattleItChanged", () => {
      if (isCancelled) return;
      refreshBattleItState();
    });

    connection.on("BattleItHalftime", (payload) => {
      if (isCancelled) return;
      setBattleItHalftime(payload || null);
    });

    connection.on("BattleItCompleted", (payload) => {
      if (isCancelled) return;
      setBattleItCompleted(payload || null);
      refreshBattleItState();
    });

    connection.on("AnswerChecked", (payload) => {
      if (isCancelled) return;

      setAnswerResult({
        roundId: payload?.roundId ?? currentRoundIdRef.current,
        isCorrect:
          payload?.alreadyAnsweredCorrectly || payload?.isCorrect === true,
      });

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
      setWordScrambleState((prev) => {
        if (!payload) return null;

        return {
          ...payload,
          playerStats: payload.playerStats ?? prev?.playerStats ?? null,
        };
      });
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

    const bumpArenaActivity = (payload) => {
      if (isCancelled) return;
      setArenaActivityVersion((prev) => prev + 1);

      const nextNotice =
        payload && typeof payload.message === "string" && payload.message.trim()
          ? {
              id: `${Date.now()}-${Math.random()}`,
              tone: payload.tone || "info",
              message: payload.message.trim(),
            }
          : null;

      if (nextNotice) {
        setArenaNotice(nextNotice);
      }
    };

    connection.on("ArenaChallengeCreated", bumpArenaActivity);
    connection.on("ArenaChallengeUpdated", bumpArenaActivity);
    connection.on("ArenaEntrySubmitted", bumpArenaActivity);
    connection.on("ArenaVoteSubmitted", bumpArenaActivity);
    connection.on("ArenaCommentCreated", bumpArenaActivity);
    connection.on("ArenaWinnerDeclared", bumpArenaActivity);

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
    const sessionId = battleItState?.sessionId;
    const sessionStatus = battleItState?.status;
    const connection = connectionRef.current;

    if (
      !isBattleItRoom ||
      !sessionId ||
      !["lobby", "active"].includes(sessionStatus) ||
      status !== "connected" ||
      !connection ||
      connection.state !== "Connected"
    ) {
      return;
    }

    connection.invoke("JoinBattleItSession", sessionId).catch(() => {
      // The state refresh will surface an expired or inaccessible session.
    });
  }, [battleItState?.sessionId, battleItState?.status, isBattleItRoom, status]);

  useEffect(() => {
    if (!arenaNotice?.id) return undefined;

    const timeoutId = window.setTimeout(() => {
      setArenaNotice((current) =>
        current?.id === arenaNotice.id ? null : current
      );
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [arenaNotice]);

  useEffect(() => {
    if (!roomId || !room || status !== "connected") return;

    let isCancelled = false;

    async function loadModeState() {
      try {
        if (isBattleTriviaRoom || isBattleItRoom) {
          const [data, battleItData] = await Promise.all([
            getRoomSessionStatus(roomId),
            isBattleItRoom ? getBattleItState(roomId).catch(() => null) : null,
          ]);
          if (isCancelled) return;
          setSessionStatus(normalizeSessionStatus(data));
          if (isBattleItRoom) setBattleItState(battleItData);
          return;
        }

        if (isWordScrambleRoom) {
          const [scrambleStatus, scrambleState] = await Promise.all([
            getWordScrambleSessionStatus(roomId).catch(() => null),
            getWordScrambleState(roomId).catch(() => null),
          ]);

          if (isCancelled) return;

          setWordScrambleStatus(scrambleStatus);
          setWordScrambleState((prev) =>
            scrambleState
              ? {
                  ...scrambleState,
                  playerStats:
                    scrambleState.playerStats ?? prev?.playerStats ?? null,
                }
              : null
          );
        }
      } catch {
        // Live room events will continue even if the initial mode snapshot fails.
      }
    }

    loadModeState();

    return () => {
      isCancelled = true;
    };
  }, [
    roomId,
    room,
    status,
    isBattleTriviaRoom,
    isBattleItRoom,
    isWordScrambleRoom,
  ]);

  const ensureConnected = useCallback(() => {
    const connection = connectionRef.current;

    if (!connection || status !== "connected") {
      throw new Error("Chat is not connected.");
    }

    return connection;
  }, [status]);

  const sendRoomPayload = useCallback(
    async (text, mode, options = {}) => {
      const connection = ensureConnected();

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

      const result = await connection.invoke(
        "SendMessage",
        roomId,
        text,
        options?.replyToMessageId ?? null
      );

      if (result && typeof result === "object" && result.success === false) {
        throw new Error(result.message || "Failed to send message.");
      }

      return result ?? true;
    },
    [roomId, ensureConnected, applyWordScrambleGuessPayload]
  );

  const editRoomMessage = useCallback(
    async (messageId, text) => {
      const connection = ensureConnected();
      await connection.invoke("EditMessage", roomId, messageId, text);
      return true;
    },
    [roomId, ensureConnected]
  );

  const toggleRoomMessageReaction = useCallback(
    async (messageId, emoji) => {
      const connection = ensureConnected();
      await connection.invoke("ToggleMessageReaction", roomId, messageId, emoji);
      return true;
    },
    [roomId, ensureConnected]
  );

  const pinRoomMessage = useCallback(
    async (messageId) => {
      const connection = ensureConnected();
      await connection.invoke("PinMessage", roomId, messageId);
      return true;
    },
    [roomId, ensureConnected]
  );

  const unpinRoomMessage = useCallback(
    async () => {
      const connection = ensureConnected();
      await connection.invoke("UnpinMessage", roomId);
      return true;
    },
    [roomId, ensureConnected]
  );

  return {
    status,
    connectionError,
    currentQuestion,
    currentRoundId,
    currentRoundNumber,
    roundEndsAt,
    timeLeft,
    correctAnswer,
    roundWinners,
    weeklyWinners,
    leaderboard,
    answerFeedback,
    answerResult,
    sessionStatus,
    playerRank,
    lastRoundPlacement,
    liveStreak,
    attemptsInfo,
    isQuestionFresh,
    isRoundReveal,
    sendRoomPayload,
    editRoomMessage,
    toggleRoomMessageReaction,
    pinRoomMessage,
    unpinRoomMessage,
    achievementUnlocks,
    wordScrambleState,
    wordScrambleStatus,
    wordScrambleGuessFeedback,
    arenaActivityVersion,
    arenaNotice,
    battleItState,
    battleItHalftime,
    battleItCompleted,
    setBattleItState,
  };
}
