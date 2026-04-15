import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ChatInput from "../components/ChatInput";
import ChatStream from "../components/chat/ChatStream";
import AchievementToastStack from "../components/profile/AchievementToastStack";
import RoomFooterBar from "../components/room/RoomFooterBar";
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

function getRoomModeMeta(room, isBattleTrivia, isWordScramble) {
  if (isBattleTrivia) {
    return {
      eyebrow: "Battle Trivia",
      badgeLabel: "Featured competition",
      badgeClass: "text-blue-300 border-blue-400/20 bg-blue-500/10",
    };
  }

  if (isWordScramble) {
    return {
      eyebrow: "Word Scramble",
      badgeLabel: "Game room",
      badgeClass: "text-violet-300 border-violet-400/20 bg-violet-500/10",
    };
  }

  if (room?.roomType === "chat") {
    return {
      eyebrow: "Community room",
      badgeLabel: "Chat room",
      badgeClass: "text-emerald-300 border-emerald-400/20 bg-emerald-500/10",
    };
  }

  return {
    eyebrow: "Room",
    badgeLabel: "Live room",
    badgeClass: "text-neutral-300 border-white/10 bg-white/[0.04]",
  };
}

function RoomUtilityBar({
  room,
  user,
  sessionLabel,
  isBattleTrivia,
  isWordScramble,
}) {
  const meta = getRoomModeMeta(room, isBattleTrivia, isWordScramble);

  return (
    <div className="mb-3 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-3 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.14)] sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-300 transition hover:border-white/15 hover:bg-white/[0.05]"
            >
              <span aria-hidden="true">←</span>
              Back to lobby
            </Link>

            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${meta.badgeClass}`}
            >
              {meta.badgeLabel}
            </span>

            {sessionLabel ? (
              <span className="inline-flex rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-300">
                {sessionLabel}
              </span>
            ) : null}
          </div>

          <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-blue-300/70">
            {meta.eyebrow}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="truncate text-[20px] font-semibold tracking-[-0.03em] text-white sm:text-[22px]">
              {room?.name || "Room"}
            </h2>

            {user?.displayName || user?.username ? (
              <span className="text-sm text-neutral-500">
                · {user.displayName || user.username}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-white transition hover:border-white/15 hover:bg-white/[0.05]"
          >
            Profile
          </Link>

          <Link
            to="/leaderboards?mode=combined&period=current"
            className="inline-flex items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-white transition hover:border-white/15 hover:bg-white/[0.05]"
          >
            Leaderboards
          </Link>
        </div>
      </div>
    </div>
  );
}

function WeeklyWinnersCard({ data }) {
  const winners = Array.isArray(data?.winners) ? data.winners : [];
  if (winners.length === 0) return null;

  return (
    <div className="mb-3 rounded-[20px] border border-amber-400/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(245,158,11,0.04))] px-3.5 py-3 sm:px-4">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-200">
          Weekly winners
        </span>
        <span aria-hidden="true">🏆</span>
      </div>

      <div className="mt-2 text-sm text-amber-100/90">
        Last week’s champions have been crowned.
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {winners.slice(0, 3).map((winner) => (
          <div
            key={`${winner.userId}-${winner.rank}`}
            className="rounded-[16px] border border-amber-300/15 bg-black/20 px-3 py-2.5"
          >
            <div className="text-[10px] uppercase tracking-[0.14em] text-amber-200/80">
              #{winner.rank}
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              {winner.displayName || winner.username}
            </div>
            <div className="mt-1 text-[11px] text-neutral-400">
              @{winner.username}
            </div>
            <div className="mt-2 text-sm font-semibold text-amber-200">
              {winner.score} pts
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileFloatingRoomNav() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] sm:hidden">
      <div className="flex items-start justify-between px-3 pt-[calc(env(safe-area-inset-top)+0.55rem)]">
        <Link
          to="/"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-neutral-950/78 px-3 py-1.5 text-[11px] font-medium text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:border-white/15 hover:bg-neutral-900/85"
        >
          <span aria-hidden="true">←</span>
          Lobby
        </Link>

        <Link
          to="/profile"
          className="pointer-events-auto inline-flex items-center rounded-full border border-white/10 bg-neutral-950/78 px-3 py-1.5 text-[11px] font-medium text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:border-white/15 hover:bg-neutral-900/85"
        >
          Profile
        </Link>
      </div>
    </div>
  );
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

  const topContent = (
    <div className="shrink-0 border-b border-white/5 bg-neutral-950/95 backdrop-blur-xl [padding-top:env(safe-area-inset-top)]">
      <div className="mx-auto w-full max-w-[68rem] px-3 pt-11 pb-2.5 sm:px-4 sm:py-3 lg:px-5">
        <div className="hidden sm:block">
          <RoomUtilityBar
            room={room}
            user={user}
            sessionLabel={effectiveSessionLabel}
            isBattleTrivia={isBattleTrivia}
            isWordScramble={isWordScramble}
          />
        </div>

        {isBattleTrivia ? <WeeklyWinnersCard data={weeklyWinners} /> : null}

        {roomStateBanner}

        {isBattleTrivia ? (
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
        ) : isWordScramble ? (
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
        ) : null}
      </div>
    </div>
  );

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
      <MobileFloatingRoomNav />

      <RoomShell
        sidebar={sidebar}
        header={null}
        topContent={topContent}
        stream={stream}
        footer={footer}
      />

      <AchievementToastStack achievements={achievementUnlocks} />
    </div>
  );
}