import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ChatInput from "../components/ChatInput";
import ChatStream from "../components/chat/ChatStream";
import AchievementToastStack from "../components/profile/AchievementToastStack";
import RoomFooterBar from "../components/room/RoomFooterBar";
import RoomHeader from "../components/room/RoomHeader";
import RoomModerationControlCard from "../components/room/RoomModerationControlCard";
import RoomShell from "../components/room/RoomShell";
import DesktopTriviaSidebar from "../components/trivia/DesktopTriviaSidebar";
import TriviaHeroCard from "../components/trivia/TriviaHeroCard";
import TriviaWhisperStatus from "../components/trivia/TriviaWhisperStatus";
import BattleTriviaProfileCard from "../components/trivia/BattleTriviaProfileCard";
import BattleTriviaSessionSummaryCard from "../components/trivia/BattleTriviaSessionSummaryCard";
import WordScrambleHeroCard from "../components/wordScramble/WordScrambleHeroCard";
import WordScrambleWhisperStatus from "../components/wordScramble/WordScrambleWhisperStatus";
import { getSessionLabel } from "../components/trivia/triviaUtils";
import {
  getMyBattleTriviaProfileStats,
  getMyBattleTriviaSessionSummary,
  getMyRoomModerationState,
} from "../api/roomsApi";
import {
  deleteRoomMessage,
  getRoomModerationActions,
  muteRoomUser,
  updateRoomSlowMode,
} from "../api/roomModerationApi";
import { useAuth } from "../hooks/useAuth";
import useRoomBootstrap from "../hooks/useRoomBootstrap";
import useRoomLiveState from "../hooks/useRoomLiveState";

function getApiErrorMessage(error, fallback) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.title ||
    error?.response?.data?.message ||
    (typeof error?.response?.data === "string" ? error.response.data : "") ||
    error?.message ||
    fallback
  );
}

function isMutedErrorMessage(value) {
  if (!value) return false;
  return value.toLowerCase().includes("muted in this room");
}

function formatMutedUntil(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getViewportState() {
  if (typeof window === "undefined") {
    return { height: 0, offsetTop: 0 };
  }

  const vv = window.visualViewport;

  return {
    height: Math.round(vv?.height || window.innerHeight || 0),
    offsetTop: Math.round(vv?.offsetTop || 0),
  };
}

export default function RoomPage() {
  const { roomId } = useParams();
  const { user, token } = useAuth();

  const [localError, setLocalError] = useState("");
  const [profileStats, setProfileStats] = useState(null);
  const [isProfileStatsLoading, setIsProfileStatsLoading] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [isSessionSummaryLoading, setIsSessionSummaryLoading] = useState(false);
  const [moderationState, setModerationState] = useState(null);
  const [isModerationStateLoading, setIsModerationStateLoading] =
    useState(false);
  const [moderationActions, setModerationActions] = useState([]);
  const [isModerationActionsLoading, setIsModerationActionsLoading] =
    useState(false);
  const [viewportState, setViewportState] = useState(getViewportState);

  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const {
    room,
    messages,
    isLoadingRoom,
    bootstrapError,
    appendMessage,
    removeMessage,
  } = useRoomBootstrap(roomId);

  const handleReceiveMessage = useCallback(
    (message) => {
      appendMessage(message);
    },
    [appendMessage]
  );

  const handleMessageDeleted = useCallback(
    (messageId) => {
      removeMessage(messageId);
    },
    [removeMessage]
  );

  const {
    status,
    connectionError,
    currentQuestion,
    currentRoundId,
    currentRoundNumber,
    timeLeft,
    correctAnswer,
    roundWinners,
    leaderboard,
    answerFeedback,
    sessionStatus,
    playerRank,
    lastRoundPlacement,
    liveStreak,
    attemptsInfo,
    isQuestionFresh,
    isRoundReveal,
    achievementUnlocks,
    wordScrambleState,
    wordScrambleStatus,
    wordScrambleGuessFeedback,
    sendRoomPayload,
  } = useRoomLiveState({
    roomId,
    token,
    room,
    onReceiveMessage: handleReceiveMessage,
    onMessageDeleted: handleMessageDeleted,
  });

  const isBattleTrivia = useMemo(() => {
    if (!room) return false;
    return room.slug === "battle-trivia" || room.roomType === "trivia";
  }, [room]);

  const isWordScramble = useMemo(() => {
    if (!room) return false;
    return room.slug === "word-scramble";
  }, [room]);

  const showGameSidebar = isBattleTrivia || isWordScramble;

  const isAdmin = user?.isAdmin === true || user?.isAdmin === "true";
  const canModerateChat = !!room && !showGameSidebar && isAdmin;

  const scramblePlayerRank = useMemo(() => {
    const myEntry = (wordScrambleState?.leaderboard || []).find(
      (entry) => entry.userId === user?.id
    );

    if (!myEntry) return null;

    return {
      rank: myEntry.rank,
      score: myEntry.score,
    };
  }, [wordScrambleState?.leaderboard, user?.id]);

  const effectiveSessionStatus = isWordScramble
    ? wordScrambleStatus
    : sessionStatus;

  const effectiveSessionLabel = isWordScramble
    ? wordScrambleStatus?.statusText || "Word Scramble"
    : getSessionLabel(sessionStatus);

  const effectiveLeaderboard = isWordScramble
    ? wordScrambleState?.leaderboard || []
    : leaderboard;

  const effectivePlayerRank = isWordScramble ? scramblePlayerRank : playerRank;

  const displayError = localError || bootstrapError || connectionError;

  const moderatedMutedMessage =
    !showGameSidebar && moderationState?.isMuted
      ? moderationState.mutedUntil
        ? `You are muted in this room until ${formatMutedUntil(
            moderationState.mutedUntil
          )}.`
        : "You are muted in this room."
      : "";

  const fallbackMutedMessage =
    !showGameSidebar && isMutedErrorMessage(localError) ? localError : "";

  const mutedBannerMessage = moderatedMutedMessage || fallbackMutedMessage;

  const slowModeMessage =
    !showGameSidebar && moderationState?.slowModeSeconds > 0
      ? `Slow mode: ${moderationState.slowModeSeconds}s`
      : "";

  const loadModerationActions = useCallback(async () => {
    if (!room || !roomId || !canModerateChat) {
      setModerationActions([]);
      setIsModerationActionsLoading(false);
      return;
    }

    setIsModerationActionsLoading(true);

    try {
      const data = await getRoomModerationActions(roomId, 12);
      setModerationActions(Array.isArray(data) ? data : []);
    } catch {
      setModerationActions([]);
    } finally {
      setIsModerationActionsLoading(false);
    }
  }, [room, roomId, canModerateChat]);

  useEffect(() => {
    const updateViewportState = () => {
      setViewportState(getViewportState());
    };

    updateViewportState();

    const vv = window.visualViewport;
    window.addEventListener("resize", updateViewportState);
    vv?.addEventListener("resize", updateViewportState);
    vv?.addEventListener("scroll", updateViewportState);

    return () => {
      window.removeEventListener("resize", updateViewportState);
      vv?.removeEventListener("resize", updateViewportState);
      vv?.removeEventListener("scroll", updateViewportState);
    };
  }, []);

  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]');

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }

    const previous = meta.getAttribute("content");
    meta.setAttribute("content", "#0a0a0a");

    return () => {
      if (previous) {
        meta.setAttribute("content", previous);
      } else {
        meta.removeAttribute("content");
      }
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevHtmlHeight = html.style.height;
    const prevBodyHeight = body.style.height;
    const prevBodyPosition = body.style.position;
    const prevBodyWidth = body.style.width;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    html.style.height = "100%";
    body.style.height = "100%";
    body.style.position = "fixed";
    body.style.width = "100%";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
      html.style.height = prevHtmlHeight;
      body.style.height = prevBodyHeight;
      body.style.position = prevBodyPosition;
      body.style.width = prevBodyWidth;
    };
  }, []);

  useEffect(() => {
    if (!isBattleTrivia || !user?.id) {
      setProfileStats(null);
      setIsProfileStatsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadProfileStats() {
      setIsProfileStatsLoading(true);

      try {
        const data = await getMyBattleTriviaProfileStats();
        if (!isMounted) return;
        setProfileStats(data);
      } catch {
        if (!isMounted) return;
        setProfileStats(null);
      } finally {
        if (!isMounted) return;
        setIsProfileStatsLoading(false);
      }
    }

    loadProfileStats();

    return () => {
      isMounted = false;
    };
  }, [isBattleTrivia, roomId, user?.id, correctAnswer]);

  useEffect(() => {
    if (!room || !roomId || !user?.id || showGameSidebar) {
      setModerationState(null);
      setIsModerationStateLoading(false);
      return;
    }

    let isMounted = true;

    async function loadModerationState() {
      setIsModerationStateLoading(true);

      try {
        const data = await getMyRoomModerationState(roomId);
        if (!isMounted) return;
        setModerationState(data);
      } catch {
        if (!isMounted) return;
        setModerationState(null);
      } finally {
        if (!isMounted) return;
        setIsModerationStateLoading(false);
      }
    }

    loadModerationState();

    return () => {
      isMounted = false;
    };
  }, [room, roomId, user?.id, showGameSidebar]);

  useEffect(() => {
    loadModerationActions();
  }, [loadModerationActions]);

  useEffect(() => {
    if (!isBattleTrivia || !user?.id) {
      setSessionSummary(null);
      setIsSessionSummaryLoading(false);
      return;
    }

    let isMounted = true;

    async function loadSessionSummary() {
      setIsSessionSummaryLoading(true);

      try {
        const data = await getMyBattleTriviaSessionSummary();
        if (!isMounted) return;
        setSessionSummary(data);
      } catch {
        if (!isMounted) return;
        setSessionSummary(null);
      } finally {
        if (!isMounted) return;
        setIsSessionSummaryLoading(false);
      }
    }

    loadSessionSummary();

    return () => {
      isMounted = false;
    };
  }, [isBattleTrivia, roomId, user?.id, sessionStatus?.sessionId]);

  const updateAutoScrollState = () => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const threshold = 120;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    shouldAutoScrollRef.current = distanceFromBottom <= threshold;
  };

  useEffect(() => {
    setLocalError("");
  }, [roomId]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    if (shouldAutoScrollRef.current) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      shouldAutoScrollRef.current = true;
    });
  }, [roomId, isLoadingRoom]);

  const handleSend = async (text) => {
    setLocalError("");

    const mode = isBattleTrivia
      ? "battle-trivia"
      : isWordScramble
      ? "word-scramble"
      : "chat";

    try {
      await sendRoomPayload(text, mode);
      return true;
    } catch (error) {
      const rawMessage =
        error?.message ||
        (mode === "battle-trivia"
          ? "Failed to submit answer."
          : mode === "word-scramble"
          ? "Failed to submit guess."
          : "Failed to send message.");

      const cleanedMessage = rawMessage.includes("HubException:")
        ? rawMessage.split("HubException:").pop().trim()
        : rawMessage;

      setLocalError(cleanedMessage);
      return false;
    }
  };

  const handleDeleteMessage = async (messageId) => {
    setLocalError("");

    try {
      await deleteRoomMessage(messageId);
      await loadModerationActions();
      return true;
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to delete message.");
      setLocalError(message);
      return false;
    }
  };

  const handleMuteUser = async (targetUserId, durationMinutes) => {
    setLocalError("");

    try {
      await muteRoomUser(
        roomId,
        targetUserId,
        durationMinutes,
        "Muted by moderator"
      );
      await loadModerationActions();
      return true;
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to mute user.");
      setLocalError(message);
      return false;
    }
  };

  const handleUpdateSlowMode = async (slowModeSeconds) => {
    setLocalError("");

    try {
      await updateRoomSlowMode(roomId, slowModeSeconds);

      setModerationState((prev) => ({
        ...(prev || {}),
        isMuted: prev?.isMuted ?? false,
        mutedUntil: prev?.mutedUntil ?? null,
        slowModeSeconds,
      }));

      await loadModerationActions();
      return true;
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to update slow mode.");
      setLocalError(message);
      return false;
    }
  };

  const sidebar = (
    <div className="hidden w-[19.5rem] shrink-0 border-r border-white/5 bg-neutral-900/95 xl:block">
      <DesktopTriviaSidebar
        room={room}
        status={status}
        sessionStatus={effectiveSessionStatus}
        sessionLabel={effectiveSessionLabel}
        isBattleTrivia={showGameSidebar}
        leaderboard={effectiveLeaderboard}
        playerRank={effectivePlayerRank}
        currentUserId={user?.id}
      />

      {isBattleTrivia ? (
        <div className="space-y-3 px-3 pb-3">
          <BattleTriviaProfileCard
            stats={profileStats}
            liveStreak={liveStreak}
            playerRank={playerRank}
            loading={isProfileStatsLoading}
            compact
          />

          <BattleTriviaSessionSummaryCard
            summary={sessionSummary}
            loading={isSessionSummaryLoading}
          />
        </div>
      ) : canModerateChat ? (
        <div className="space-y-3 px-3 pb-3">
          <RoomModerationControlCard
            roomName={room?.name}
            slowModeSeconds={moderationState?.slowModeSeconds ?? 0}
            onUpdateSlowMode={handleUpdateSlowMode}
            moderationActions={moderationActions}
            isLoadingActions={isModerationActionsLoading}
          />
        </div>
      ) : null}
    </div>
  );

  const header = (
    <RoomHeader
      roomName={room?.name}
      status={status}
      sessionLabel={effectiveSessionLabel}
      userDisplayName={user?.displayName || user?.username}
      isBattleTrivia={showGameSidebar}
    />
  );

  const roomStateBanner =
    status === "reconnecting" ? (
      <div className="mb-3 rounded-[18px] border border-amber-500/15 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        Reconnecting live room… updates should resume in a moment.
      </div>
    ) : status === "connecting" && !isLoadingRoom ? (
      <div className="mb-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-neutral-300">
        Connecting to the live room…
      </div>
    ) : null;

  const topContent = isBattleTrivia ? (
    <div className="shrink-0 border-b border-white/5 bg-neutral-950/95 backdrop-blur-xl [padding-top:env(safe-area-inset-top)]">
      <div className="mx-auto w-full max-w-[68rem] px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5">
        {roomStateBanner}

        <TriviaHeroCard
          currentRoundNumber={currentRoundNumber}
          sessionStatus={sessionStatus}
          timeLeft={timeLeft}
          currentQuestion={currentQuestion}
          correctAnswer={correctAnswer}
          roundWinners={roundWinners}
          isQuestionFresh={isQuestionFresh}
          isRoundReveal={isRoundReveal}
          hasActiveRound={!!currentRoundId}
          lastRoundPlacement={lastRoundPlacement}
        />
      </div>
    </div>
  ) : isWordScramble ? (
    <div className="shrink-0 border-b border-white/5 bg-neutral-950/95 backdrop-blur-xl [padding-top:env(safe-area-inset-top)]">
      <div className="mx-auto w-full max-w-[68rem] px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5">
        {roomStateBanner}

        <WordScrambleHeroCard
          roundNumber={wordScrambleState?.roundNumber}
          maskedWord={wordScrambleState?.maskedWord}
          answerWord={wordScrambleState?.answerWord}
          category={wordScrambleState?.category}
          hint={wordScrambleState?.hint}
          phase={wordScrambleState?.phase}
          timeLeft={wordScrambleState?.timeLeft ?? 0}
          winners={wordScrambleState?.winners || []}
        />
      </div>
    </div>
  ) : null;

  const stream = (
    <ChatStream
      messages={messages}
      currentUserId={user?.id}
      error={displayError}
      isLoading={isLoadingRoom}
      containerRef={messagesContainerRef}
      onScroll={updateAutoScrollState}
      isAdmin={canModerateChat}
      onDeleteMessage={handleDeleteMessage}
      onMuteUser={handleMuteUser}
    />
  );

  const footer = (
    <RoomFooterBar
      whisper={
        isBattleTrivia ? (
          <TriviaWhisperStatus
            answerFeedback={answerFeedback}
            attemptsInfo={attemptsInfo}
            currentRoundId={currentRoundId}
          />
        ) : isWordScramble ? (
          <WordScrambleWhisperStatus
            guessFeedback={wordScrambleGuessFeedback}
            currentRoundId={wordScrambleState?.roundId}
          />
        ) : mutedBannerMessage ? (
          <div className="rounded-[16px] border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {mutedBannerMessage}
          </div>
        ) : slowModeMessage ? (
          <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-neutral-300">
            {slowModeMessage}
          </div>
        ) : null
      }
      composer={
        <ChatInput
          onSend={handleSend}
          placeholder={
            isBattleTrivia
              ? currentRoundId
                ? "Type your answer..."
                : "Waiting for next round..."
              : isWordScramble
              ? wordScrambleState?.roundId &&
                wordScrambleState?.phase === "active"
                ? "Type your guess..."
                : "Waiting for next word..."
              : mutedBannerMessage
              ? "You are muted in this room"
              : isModerationStateLoading
              ? "Checking room status..."
              : "Type a message..."
          }
          buttonLabel={
            isBattleTrivia
              ? currentRoundId
                ? "Answer"
                : "Waiting..."
              : isWordScramble
              ? wordScrambleState?.roundId &&
                wordScrambleState?.phase === "active"
                ? "Guess"
                : "Waiting..."
              : "Send"
          }
          busyLabel={
            isBattleTrivia
              ? "Answering..."
              : isWordScramble
              ? "Guessing..."
              : "Sending..."
          }
          disabled={
            status !== "connected" ||
            isLoadingRoom ||
            (isBattleTrivia && !currentRoundId) ||
            (isWordScramble &&
              (!wordScrambleState?.roundId ||
                wordScrambleState?.phase !== "active")) ||
            (!showGameSidebar &&
              (Boolean(mutedBannerMessage) || isModerationStateLoading))
          }
        />
      }
    />
  );

  return (
    <div
      className="fixed inset-x-0 overflow-hidden overscroll-none bg-neutral-950 text-white"
      style={{
        top: `${viewportState.offsetTop}px`,
        height: viewportState.height
          ? `${viewportState.height}px`
          : "100dvh",
      }}
    >
      <RoomShell
        sidebar={sidebar}
        header={header}
        topContent={topContent}
        stream={stream}
        footer={footer}
      />

      <AchievementToastStack achievements={achievementUnlocks} />
    </div>
  );
}