import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import ChatInput from "../components/ChatInput";
import ChatStream from "../components/chat/ChatStream";
import MentionToastStack from "../components/chat/MentionToastStack";
import AchievementToastStack from "../components/profile/AchievementToastStack";
import ArenaCreateChallengeModal from "../components/arena/ArenaCreateChallengeModal";
import ArenaRoomPanel from "../components/arena/ArenaRoomPanel";
import BattleItPanel from "../components/battleIt/BattleItPanel";
import BattleItAnswerOptions from "../components/battleIt/BattleItAnswerOptions";
import RoomFooterBar from "../components/room/RoomFooterBar";
import RoomModerationControlCard from "../components/room/RoomModerationControlCard";
import RoomShell from "../components/room/RoomShell";
import DesktopTriviaSidebar from "../components/trivia/DesktopTriviaSidebar";
import TriviaHeroCard from "../components/trivia/TriviaHeroCard";
import TriviaWhisperStatus from "../components/trivia/TriviaWhisperStatus";
import BattleTriviaProfileCard from "../components/trivia/BattleTriviaProfileCard";
import BattleTriviaSessionSummaryCard from "../components/trivia/BattleTriviaSessionSummaryCard";
import { getSessionLabel } from "../components/trivia/triviaUtils";
import WordScrambleHeroCard from "../components/wordScramble/WordScrambleHeroCard";
import WordScrambleProfileCard from "../components/wordScramble/WordScrambleProfileCard";
import WordScrambleSessionCard from "../components/wordScramble/WordScrambleSessionCard";
import WordScrambleWhisperStatus from "../components/wordScramble/WordScrambleWhisperStatus";
import {
  createArenaComment,
  createArenaChallenge,
  getArenaChallengeDetail,
  getArenaChallenges,
  getArenaHallOfBars,
  getArenaLeaderboard,
  submitArenaEntry,
  voteArenaEntry,
} from "../api/arenaApi";
import {
  getMyBattleTriviaProfileStats,
  getMyBattleTriviaSessionSummary,
  getMyRoomModerationState,
  getRoomMessageContext,
  markMessageMentionRead,
  markRoomMentionsRead,
} from "../api/roomsApi";
import { getActiveSponsor } from "../api/sponsorApi";
import {
  deleteRoomMessage,
  getRoomModerationActions,
  muteRoomUser,
  updateRoomSlowMode,
} from "../api/roomModerationApi";
import { useAuth } from "../hooks/useAuth";
import useRoomSoundEffects from "../hooks/useRoomSoundEffects";
import { useTheme } from "../hooks/useTheme";
import useRoomBootstrap from "../hooks/useRoomBootstrap";
import useRoomLiveState from "../hooks/useRoomLiveState";
import { useMentions } from "../context/MentionContext";
import SponsorSpotlightCard, {
  hasSponsorPlacement,
} from "../components/sponsor/SponsorSpotlightCard";

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

function isSlowModeErrorMessage(value) {
  if (!value) return false;
  return value.toLowerCase().includes("slow mode is active");
}

function getSlowModeWaitSeconds(value) {
  if (!value) return 0;
  const match = value.match(/wait\s+(\d+)\s+seconds?/i);
  return match ? Number(match[1]) || 0 : 0;
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

function isKeyboardTarget(element) {
  if (!element || element === document.body) return false;

  const tagName = element.tagName?.toLowerCase();
  return (
    tagName === "textarea" ||
    tagName === "select" ||
    (tagName === "input" &&
      !["button", "checkbox", "file", "radio", "range", "submit"].includes(
        String(element.type || "").toLowerCase()
      )) ||
    element.isContentEditable === true
  );
}

function getViewportState() {
  if (typeof window === "undefined") {
    return { height: 0, offsetTop: 0, layoutHeight: 0, width: 0 };
  }

  const vv = window.visualViewport;
  const activeElement = document.activeElement;
  const hasKeyboardFocus = isKeyboardTarget(activeElement);
  const visualHeight = Math.round(vv?.height || 0);
  const windowHeight = Math.round(window.innerHeight || 0);
  const documentHeight = Math.round(
    document.documentElement?.clientHeight || 0
  );
  const layoutHeight = Math.max(windowHeight, documentHeight, visualHeight);
  const measuredHeight = visualHeight || windowHeight || documentHeight || 0;
  const height = hasKeyboardFocus
    ? measuredHeight
    : Math.max(measuredHeight, layoutHeight);

  return {
    height,
    offsetTop: hasKeyboardFocus ? Math.round(vv?.offsetTop || 0) : 0,
    layoutHeight,
    width: Math.round(vv?.width || window.innerWidth || 0),
  };
}

function getRoomModeMeta(room, isBattleTrivia, isWordScramble) {
  if (room?.slug === "battle-it") {
    return {
      eyebrow: "AI Battle Creator",
      badgeLabel: "Battle It",
      badgeClass: "text-cyan-200 border-cyan-400/20 bg-cyan-500/10",
    };
  }

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
  compact = false,
}) {
  const meta = getRoomModeMeta(room, isBattleTrivia, isWordScramble);
  const liveLabel = sessionLabel || meta.badgeLabel;
  const compactBadgeLabel =
    compact && isBattleTrivia ? "Live now" : liveLabel;

  return (
    <div
      className={`rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] shadow-[0_12px_28px_rgba(0,0,0,0.12)] ${
        compact
          ? "mb-2 rounded-[16px] px-3 py-2 sm:px-3"
          : "mb-2.5 px-3 py-2.5 sm:px-3.5"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/"
          className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] font-medium uppercase tracking-[0.14em] text-neutral-300 transition hover:border-white/15 hover:bg-white/[0.05] ${
            compact ? "px-2.5 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]"
          }`}
        >
          <span aria-hidden="true">←</span>
          Lobby
        </Link>

        <span
          className={`inline-flex rounded-full border font-medium uppercase tracking-[0.14em] ${meta.badgeClass} ${
            compact ? "px-2 py-0.5 text-[8px]" : "px-2.5 py-1 text-[9px]"
          }`}
        >
          {compactBadgeLabel}
        </span>
      </div>

      {compact ? null : (
        <div className="mt-2.5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-blue-300/70">
          {meta.eyebrow}
        </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2
            className={`truncate font-semibold tracking-[-0.03em] text-white ${
              compact ? "text-[16px] sm:text-[18px]" : "text-[18px] sm:text-[20px]"
            }`}
          >
            {room?.name || "Room"}
          </h2>

          {user?.displayName || user?.username ? (
            <span className="text-[12px] text-neutral-500">
              · {user.displayName || user.username}
            </span>
          ) : null}
          </div>
        </div>
      )}
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

function MobileFloatingRoomNav({ compact = false }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] sm:hidden">
      <div
        className={`flex items-start justify-between px-3 ${
          compact
            ? "pt-[calc(env(safe-area-inset-top)+0.35rem)]"
            : "pt-[calc(env(safe-area-inset-top)+0.55rem)]"
        }`}
      >
        <Link
          to="/"
          className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-neutral-950/78 font-medium text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:border-white/15 hover:bg-neutral-900/85 ${
            compact ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-1.5 text-[11px]"
          }`}
        >
          <span aria-hidden="true">←</span>
          Lobby
        </Link>

        <Link
          to="/profile"
          className={`pointer-events-auto inline-flex items-center rounded-full border border-white/10 bg-neutral-950/78 font-medium text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:border-white/15 hover:bg-neutral-900/85 ${
            compact ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-1.5 text-[11px]"
          }`}
        >
          Profile
        </Link>
      </div>
    </div>
  );
}

function MobileRoomMetaBar({
  room,
  user,
  sessionLabel,
  isBattleTrivia,
  isWordScramble,
}) {
  if (room?.slug === "rapnometry-arena") {
    return null;
  }

  const meta = getRoomModeMeta(room, isBattleTrivia, isWordScramble);

  return (
    <div className="mb-2 rounded-[15px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.026),rgba(255,255,255,0.012))] px-3 py-2 sm:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${meta.badgeClass}`}
        >
          {meta.badgeLabel}
        </span>

        {sessionLabel ? (
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-neutral-300">
            {sessionLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-2">
        <div className="truncate text-[15px] font-semibold tracking-[-0.03em] text-white">
          {room?.name || "Room"}
        </div>

        {(user?.displayName || user?.username) && (
          <div className="mt-1 text-[11px] text-neutral-500">
            {user.displayName || user.username}
          </div>
        )}
      </div>
    </div>
  );
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function messageMentionsUsername(messageText, username) {
  if (!messageText || !username) return false;

  const regex = new RegExp(
    `(^|\\s)@${escapeRegExp(username)}(?=$|\\s|[.,!?;:])`,
    "i"
  );

  return regex.test(messageText);
}

function deriveHasOlderMessagesFromContext(messages, targetMessageId, beforeCount) {
  if (!Array.isArray(messages) || messages.length === 0 || !targetMessageId) {
    return false;
  }

  const targetIndex = messages.findIndex((message) => message.id === targetMessageId);
  if (targetIndex < 0) {
    return messages.length > 0;
  }

  return targetIndex >= Math.max(1, beforeCount);
}

export default function RoomPage() {
  const { roomId } = useParams();
  const { user, token } = useAuth();
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const { clearRoomMentions, refreshMentionCounts } = useMentions();

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
  const [replyTarget, setReplyTarget] = useState(null);
  const [slowModeBlockedUntil, setSlowModeBlockedUntil] = useState(0);
  const [slowModeNow, setSlowModeNow] = useState(() => Date.now());
  const [battleTriviaSponsor, setBattleTriviaSponsor] = useState(null);
  const [mentionToasts, setMentionToasts] = useState([]);
  const [arenaTab, setArenaTab] = useState("chat");
  const [arenaChallenges, setArenaChallenges] = useState([]);
  const [arenaSelectedChallengeId, setArenaSelectedChallengeId] = useState("");
  const [arenaSelectedChallengeDetail, setArenaSelectedChallengeDetail] =
    useState(null);
  const [arenaHallOfBars, setArenaHallOfBars] = useState([]);
  const [arenaLeaderboardRows, setArenaLeaderboardRows] = useState([]);
  const [arenaLoading, setArenaLoading] = useState(false);
  const [arenaError, setArenaError] = useState("");
  const [arenaActionBusy, setArenaActionBusy] = useState(false);
  const [arenaActionError, setArenaActionError] = useState("");
  const [isArenaCreateOpen, setIsArenaCreateOpen] = useState(false);

  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const roomMentionSyncKeyRef = useRef("");
  const profileStatsRef = useRef(null);
  const sessionSummaryRef = useRef(null);

const {
  room,
  messages,
  pinnedMessage,
  isLoadingRoom,
  isLoadingOlder,
  hasOlderMessages,
  bootstrapError,
  appendMessage,
  removeMessage,
  updateMessage,
  updateMessageReactions,
  setPinnedMessage,
  setMessages,
  loadOlderMessages,
} = useRoomBootstrap(roomId);

  const isBattleTrivia = useMemo(() => {
    if (!room) return false;
    return room.slug === "battle-trivia" || room.roomType === "trivia";
  }, [room]);

  const isBattleIt = room?.slug === "battle-it";
  const isTriviaAnswerRoom = isBattleTrivia || isBattleIt;

  const isWordScramble = useMemo(() => {
    if (!room) return false;
    return room.slug === "word-scramble";
  }, [room]);

  const isArenaRoom = useMemo(() => {
    if (!room) return false;
    return room.slug === "rapnometry-arena";
  }, [room]);
  const isArenaChallengeOpen =
    isArenaRoom &&
    arenaTab !== "chat" &&
    arenaTab !== "hall" &&
    arenaTab !== "rankings" &&
    !!arenaSelectedChallengeId;

  const showGameSidebar = isTriviaAnswerRoom || isWordScramble;
  const isChatRoom = room?.roomType === "chat";
  const isLight = resolvedTheme === "light";
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  const isAdmin = user?.isAdmin === true || user?.isAdmin === "true";
  const canModerateChat = !!room && !showGameSidebar && isAdmin;

  const isMobileViewport =
    viewportState.width > 0 && viewportState.width < 640;
  const isShortDesktopViewport =
    !isMobileViewport &&
    viewportState.height > 0 &&
    viewportState.height < 860;
  const keyboardInset = Math.max(
    0,
    viewportState.layoutHeight - viewportState.height - viewportState.offsetTop
  );
  const isKeyboardOpen = isMobileViewport && keyboardInset > 140;
  const shouldCompactMobileChrome = isMobileViewport && isKeyboardOpen;
  const shouldCompactGameChrome = showGameSidebar && isShortDesktopViewport;

  const handleReceiveMessage = useCallback(
    async (message) => {
      appendMessage(message);

      const isChatUserMessage =
        message?.messageType === "user" && !!message?.messageText;

      const isMine = message?.userId && message.userId === user?.id;
      const isMention =
        isChatUserMessage &&
        !isMine &&
        messageMentionsUsername(message.messageText, user?.username);

        if (isMention) {
          setMentionToasts((prev) => {
            const exists = prev.some((item) => item.id === message.id);
            if (exists) return prev;

            return [
              ...prev,
              {
                id: message.id,
                userId: message.userId,
                username: message.username,
                displayName: message.displayName,
                messageText: message.messageText,
              },
            ];
          });
        }
    },
    [appendMessage, user?.id, user?.username]
  );

  const handleMessageDeleted = useCallback(
    (messageId) => {
      removeMessage(messageId);
    },
    [removeMessage]
  );

  const handleMessageUpdated = useCallback(
    (payload) => {
      updateMessage(payload);
    },
    [updateMessage]
  );

  const handleMessageReactionUpdated = useCallback(
    (payload) => {
      updateMessageReactions(payload);
    },
    [updateMessageReactions]
  );

  const handleMessagePinned = useCallback(
    (payload) => {
      setPinnedMessage(payload?.message || payload || null);
    },
    [setPinnedMessage]
  );

  const handleMessageUnpinned = useCallback(() => {
    setPinnedMessage(null);
  }, [setPinnedMessage]);

  const dismissMentionToast = useCallback((messageId) => {
    setMentionToasts((prev) => prev.filter((item) => item.id !== messageId));
  }, []);

  const focusMessageInStream = useCallback(
    async (messageId, options = {}) => {
      if (!messageId) return false;

      const {
        markMentionRead: shouldMarkMentionRead = false,
        beforeCount = 25,
        afterCount = 25,
      } = options;

      const scrollToMessage = async () => {
        const node = document.getElementById(`message-${messageId}`);
        if (!node) return false;

        node.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        if (shouldMarkMentionRead) {
          try {
            await markMessageMentionRead(messageId);
            await refreshMentionCounts();
          } catch {
            // ignore mention read sync errors
          }
        }

        return true;
      };

      const existingNode = document.getElementById(`message-${messageId}`);
      if (existingNode) {
        await scrollToMessage();
        return true;
      }

      if (!roomId || !room || !isChatRoom) {
        return false;
      }

      try {
        const contextMessages = await getRoomMessageContext(
          roomId,
          messageId,
          beforeCount,
          afterCount
        );

        if (!Array.isArray(contextMessages) || contextMessages.length === 0) {
          return false;
        }

        shouldAutoScrollRef.current = false;

        setMessages(contextMessages, {
          hasOlderMessages: deriveHasOlderMessagesFromContext(
            contextMessages,
            messageId,
            beforeCount
          ),
        });

        return await new Promise((resolve) => {
          requestAnimationFrame(() => {
            scrollToMessage().then(resolve);
          });
        });
      } catch {
        return false;
      }
    },
    [isChatRoom, refreshMentionCounts, room, roomId, setMessages]
  );

  const handleJumpToMentionMessage = useCallback(
    async (messageId) => {
      dismissMentionToast(messageId);
      await focusMessageInStream(messageId, { markMentionRead: true });
    },
    [dismissMentionToast, focusMessageInStream]
  );

  const handleLoadOlderMessages = useCallback(async () => {
  const el = messagesContainerRef.current;

  if (!el) {
    await loadOlderMessages();
    return;
  }

  const previousScrollHeight = el.scrollHeight;
  const previousScrollTop = el.scrollTop;

  await loadOlderMessages();

  requestAnimationFrame(() => {
    const nextScrollHeight = el.scrollHeight;
    const addedHeight = nextScrollHeight - previousScrollHeight;

    el.scrollTop = previousScrollTop + addedHeight;
  });
}, [loadOlderMessages]);


  const {
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
    arenaActivityVersion,
    arenaNotice,
    battleItState,
    battleItHalftime,
    setBattleItState,
    sendRoomPayload,
    editRoomMessage,
    toggleRoomMessageReaction,
    pinRoomMessage,
    unpinRoomMessage,
  } = useRoomLiveState({
    roomId,
    token,
    room,
    onReceiveMessage: handleReceiveMessage,
    onMessageDeleted: handleMessageDeleted,
    onMessageUpdated: handleMessageUpdated,
    onMessageReactionUpdated: handleMessageReactionUpdated,
    onMessagePinned: handleMessagePinned,
    onMessageUnpinned: handleMessageUnpinned,
  });

  useRoomSoundEffects({
    isChatRoom,
    isBattleTrivia: isTriviaAnswerRoom,
    isWordScramble,
    currentRoundId,
    roundEndsAt,
    timeLeft,
    lastRoundPlacement,
    mentionToasts,
    wordScrambleState,
    wordScrambleGuessFeedback,
  });

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

  const mentionUsers = useMemo(() => {
    const map = new Map();

    for (const message of messages) {
      if (message?.messageType !== "user") continue;
      if (!message?.userId || !message?.username) continue;

      if (!map.has(message.userId)) {
        map.set(message.userId, {
          id: message.userId,
          username: message.username,
          displayName: message.displayName || message.username,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      String(a.displayName || a.username).localeCompare(
        String(b.displayName || b.username)
      )
    );
  }, [messages]);

  const effectiveSessionStatus = isWordScramble
    ? wordScrambleStatus
    : sessionStatus;

  const effectiveSessionLabel = isWordScramble
    ? wordScrambleStatus?.statusText || "Word Scramble"
    : isBattleIt
    ? battleItState?.status === "active"
      ? "Live battle"
      : battleItState?.status === "lobby"
      ? "Players joining"
      : battleItState?.status === "draft"
      ? "Creator review"
      : battleItState?.status === "completed"
      ? "Battle complete"
      : "Create from notes"
    : getSessionLabel(sessionStatus);

  const effectiveLeaderboard = isWordScramble
    ? wordScrambleState?.leaderboard || []
    : leaderboard;

  const effectivePlayerRank = isWordScramble ? scramblePlayerRank : playerRank;

  const activeSlowModeRemainingSeconds =
    slowModeBlockedUntil > slowModeNow
      ? Math.max(1, Math.ceil((slowModeBlockedUntil - slowModeNow) / 1000))
      : 0;

  const slowModeBlockMessage = activeSlowModeRemainingSeconds
    ? `Slow mode active. Try again in ${activeSlowModeRemainingSeconds}s.`
    : "";

  const displayError =
    !isSlowModeErrorMessage(localError) && localError
      ? localError
      : bootstrapError || connectionError;

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

  const loadArenaChallenges = useCallback(async () => {
    if (!roomId || !isArenaRoom) return;

    const bucket =
      arenaTab === "open" || arenaTab === "voting" || arenaTab === "winners"
        ? arenaTab
        : "open";

    setArenaLoading(true);
    setArenaError("");

    try {
      const data = await getArenaChallenges(roomId, bucket, 50);
      const rows = Array.isArray(data) ? data : [];
      setArenaChallenges(rows);

      setArenaSelectedChallengeId((current) => {
        if (rows.some((item) => item.id === current)) return current;
        return "";
      });
    } catch {
      setArenaError("Failed to load arena challenges.");
      setArenaChallenges([]);
      setArenaSelectedChallengeId("");
    } finally {
      setArenaLoading(false);
    }
  }, [roomId, isArenaRoom, arenaTab]);

  const loadArenaHallOfBars = useCallback(async () => {
    if (!roomId || !isArenaRoom) return;

    setArenaLoading(true);
    setArenaError("");

    try {
      const data = await getArenaHallOfBars(roomId, 20);
      setArenaHallOfBars(Array.isArray(data) ? data : []);
    } catch {
      setArenaError("Failed to load Hall of Bars.");
      setArenaHallOfBars([]);
    } finally {
      setArenaLoading(false);
    }
  }, [roomId, isArenaRoom]);

  const loadArenaLeaderboard = useCallback(async () => {
    if (!roomId || !isArenaRoom) return;

    setArenaLoading(true);
    setArenaError("");

    try {
      const data = await getArenaLeaderboard(roomId, 20);
      setArenaLeaderboardRows(Array.isArray(data) ? data : []);
    } catch {
      setArenaError("Failed to load arena leaderboard.");
      setArenaLeaderboardRows([]);
    } finally {
      setArenaLoading(false);
    }
  }, [roomId, isArenaRoom]);

  const loadArenaChallengeDetail = useCallback(async () => {
    if (!roomId || !isArenaRoom || !arenaSelectedChallengeId) {
      setArenaSelectedChallengeDetail(null);
      return;
    }

    try {
      const data = await getArenaChallengeDetail(roomId, arenaSelectedChallengeId);
      setArenaSelectedChallengeDetail(data || null);
    } catch {
      setArenaSelectedChallengeDetail(null);
    }
  }, [roomId, isArenaRoom, arenaSelectedChallengeId]);

  useEffect(() => {
    let frameId = 0;
    const timeoutIds = new Set();

    const updateViewportState = () => {
      setViewportState(getViewportState());
    };

    const scheduleViewportUpdate = (delay = 0) => {
      if (delay > 0) {
        const timeoutId = window.setTimeout(() => {
          timeoutIds.delete(timeoutId);
          scheduleViewportUpdate();
        }, delay);

        timeoutIds.add(timeoutId);
        return;
      }

      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateViewportState();
      });
    };

    const settleViewportAfterKeyboardChange = () => {
      scheduleViewportUpdate();
      scheduleViewportUpdate(80);
      scheduleViewportUpdate(180);
      scheduleViewportUpdate(360);
    };

    updateViewportState();

    const vv = window.visualViewport;
    window.addEventListener("resize", scheduleViewportUpdate);
    window.addEventListener("orientationchange", settleViewportAfterKeyboardChange);
    window.addEventListener("focusin", settleViewportAfterKeyboardChange);
    window.addEventListener("focusout", settleViewportAfterKeyboardChange);
    window.addEventListener("pageshow", settleViewportAfterKeyboardChange);
    document.addEventListener("visibilitychange", settleViewportAfterKeyboardChange);
    vv?.addEventListener("resize", scheduleViewportUpdate);
    vv?.addEventListener("scroll", scheduleViewportUpdate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIds.clear();

      window.removeEventListener("resize", scheduleViewportUpdate);
      window.removeEventListener(
        "orientationchange",
        settleViewportAfterKeyboardChange
      );
      window.removeEventListener("focusin", settleViewportAfterKeyboardChange);
      window.removeEventListener("focusout", settleViewportAfterKeyboardChange);
      window.removeEventListener("pageshow", settleViewportAfterKeyboardChange);
      document.removeEventListener(
        "visibilitychange",
        settleViewportAfterKeyboardChange
      );
      vv?.removeEventListener("resize", scheduleViewportUpdate);
      vv?.removeEventListener("scroll", scheduleViewportUpdate);
    };
  }, []);

    useEffect(() => {
      const targetMessageId = location.state?.targetMessageId;

      if (!roomId || !room || !isChatRoom || !targetMessageId) return;

      let isMounted = true;

      async function loadTargetMentionContext() {
        const focused = await focusMessageInStream(targetMessageId, {
          markMentionRead: true,
        });

        if (!isMounted || focused) {
          return;
        }
      }

      loadTargetMentionContext();

      return () => {
        isMounted = false;
      };
    }, [roomId, room, isChatRoom, location.state, focusMessageInStream]);

  useEffect(() => {
    const targetMessageId = location.state?.targetMessageId;

    if (!roomId || !room || !isChatRoom) {
      roomMentionSyncKeyRef.current = "";
      return;
    }

    if (targetMessageId) {
      roomMentionSyncKeyRef.current = "";
      return;
    }

    const syncKey = `${roomId}:room-open`;
    if (roomMentionSyncKeyRef.current === syncKey) {
      return;
    }

    roomMentionSyncKeyRef.current = syncKey;
    clearRoomMentions(roomId);

    markRoomMentionsRead(roomId).catch(() => {
      refreshMentionCounts().catch(() => {
        // ignore mention count re-sync errors after room-open read attempt
      });
    });
  }, [
    clearRoomMentions,
    isChatRoom,
    location.state,
    refreshMentionCounts,
    room,
    roomId,
  ]);

  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]');

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }

    const previous = meta.getAttribute("content");
    meta.setAttribute(
      "content",
      resolvedTheme === "light" ? "#f4f0e8" : "#0a0a0a"
    );

    return () => {
      if (previous) {
        meta.setAttribute("content", previous);
      } else {
        meta.removeAttribute("content");
      }
    };
  }, [resolvedTheme]);

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
    profileStatsRef.current = profileStats;
  }, [profileStats]);

  useEffect(() => {
    sessionSummaryRef.current = sessionSummary;
  }, [sessionSummary]);

  useEffect(() => {
    if (!isBattleTrivia || !user?.id) {
      setProfileStats(null);
      setIsProfileStatsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadProfileStats() {
      const shouldShowLoader = !profileStatsRef.current;
      if (shouldShowLoader) {
        setIsProfileStatsLoading(true);
      }

      try {
        const data = await getMyBattleTriviaProfileStats();
        if (!isMounted) return;
        setProfileStats(data);
      } catch {
        if (!isMounted) return;
        if (!profileStatsRef.current) {
          setProfileStats(null);
        }
      } finally {
        if (!isMounted) return;
        if (shouldShowLoader) {
          setIsProfileStatsLoading(false);
        }
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
    if (!isArenaRoom) return;

    if (arenaTab === "hall") {
      loadArenaHallOfBars();
      return;
    }

    if (arenaTab === "rankings") {
      loadArenaLeaderboard();
      return;
    }

    if (arenaTab !== "chat") {
      loadArenaChallenges();
    }
  }, [
    isArenaRoom,
    arenaTab,
    arenaActivityVersion,
    loadArenaChallenges,
    loadArenaHallOfBars,
    loadArenaLeaderboard,
  ]);

  useEffect(() => {
    if (!isArenaRoom || arenaTab === "chat" || arenaTab === "hall" || arenaTab === "rankings") {
      setArenaSelectedChallengeDetail(null);
      return;
    }

    loadArenaChallengeDetail();
  }, [isArenaRoom, arenaTab, arenaSelectedChallengeId, arenaActivityVersion, loadArenaChallengeDetail]);

  useEffect(() => {
    setMentionToasts([]);
  }, [roomId]);

  useEffect(() => {
    setMentionToasts((prev) =>
      prev.filter((item) => messages.some((message) => message.id === item.id))
    );
  }, [messages]);

  useEffect(() => {
    if (!isBattleTrivia || !user?.id) {
      setSessionSummary(null);
      setIsSessionSummaryLoading(false);
      return;
    }

    let isMounted = true;

    async function loadSessionSummary() {
      const shouldShowLoader = !sessionSummaryRef.current;
      if (shouldShowLoader) {
        setIsSessionSummaryLoading(true);
      }

      try {
        const data = await getMyBattleTriviaSessionSummary();
        if (!isMounted) return;
        setSessionSummary(data);
      } catch {
        if (!isMounted) return;
        if (!sessionSummaryRef.current) {
          setSessionSummary(null);
        }
      } finally {
        if (!isMounted) return;
        if (shouldShowLoader) {
          setIsSessionSummaryLoading(false);
        }
      }
    }

    loadSessionSummary();

    return () => {
      isMounted = false;
    };
  }, [isBattleTrivia, roomId, user?.id, sessionStatus?.sessionId]);

  useEffect(() => {
    if (!isBattleTrivia) {
      setBattleTriviaSponsor(null);
      return;
    }

    let isMounted = true;

    getActiveSponsor("battle-trivia")
      .then((data) => {
        if (isMounted) {
          setBattleTriviaSponsor(data || null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBattleTriviaSponsor(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isBattleTrivia]);

  const updateAutoScrollState = () => {
    if (showGameSidebar) {
      shouldAutoScrollRef.current = true;
      return;
    }

    const el = messagesContainerRef.current;
    if (!el) return;

    const threshold = 120;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    shouldAutoScrollRef.current = distanceFromBottom <= threshold;
  };

  useEffect(() => {
    setLocalError("");
    setSlowModeBlockedUntil(0);
  }, [roomId]);

  useEffect(() => {
    setArenaTab("chat");
    setArenaChallenges([]);
    setArenaSelectedChallengeId("");
    setArenaSelectedChallengeDetail(null);
    setArenaHallOfBars([]);
    setArenaLeaderboardRows([]);
    setArenaError("");
    setArenaActionError("");
    setIsArenaCreateOpen(false);
  }, [roomId]);

  useEffect(() => {
    if (!slowModeBlockedUntil) return undefined;

    setSlowModeNow(Date.now());
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      setSlowModeNow(now);

      if (now >= slowModeBlockedUntil) {
        setSlowModeBlockedUntil(0);
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [slowModeBlockedUntil]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    if (shouldAutoScrollRef.current) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, showGameSidebar]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      shouldAutoScrollRef.current = true;
    });
  }, [roomId, isLoadingRoom]);

  useEffect(() => {
    setReplyTarget(null);
  }, [roomId]);

  useEffect(() => {
    if (!replyTarget) return;

    const stillExists = messages.some((message) => message.id === replyTarget.id);
    if (!stillExists) {
      setReplyTarget(null);
    }
  }, [messages, replyTarget]);

  const handleSend = async (text, options = {}) => {
    setLocalError("");

    const mode = isTriviaAnswerRoom
      ? "battle-trivia"
      : isWordScramble
      ? "word-scramble"
      : "chat";

    try {
      await sendRoomPayload(text, mode, options);
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

      if (isSlowModeErrorMessage(cleanedMessage)) {
        const waitSeconds =
          getSlowModeWaitSeconds(cleanedMessage) ||
          moderationState?.slowModeSeconds ||
          1;

        setSlowModeBlockedUntil(Date.now() + waitSeconds * 1000);
        setSlowModeNow(Date.now());
        setLocalError("");
      } else {
        setLocalError(cleanedMessage);
      }

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

  const handleReplyMessage = useCallback((message) => {
    setReplyTarget(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTarget(null);
  }, []);

  const handleEditMessage = async (messageId, text) => {
    setLocalError("");

    try {
      await editRoomMessage(messageId, text);
      return true;
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to edit message.");
      setLocalError(message);
      return false;
    }
  };

  const handleToggleReaction = async (messageId, emoji) => {
    setLocalError("");

    try {
      await toggleRoomMessageReaction(messageId, emoji);
      return true;
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to react to message.");
      setLocalError(message);
      return false;
    }
  };

  const handlePinMessage = async (messageId) => {
    setLocalError("");

    try {
      await pinRoomMessage(messageId);
      return true;
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to pin message.");
      setLocalError(message);
      return false;
    }
  };

  const handleUnpinMessage = async () => {
    setLocalError("");

    try {
      await unpinRoomMessage();
      return true;
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to unpin message.");
      setLocalError(message);
      return false;
    }
  };

  const handleArenaCreateChallenge = async (payload) => {
    setArenaActionBusy(true);
    setArenaActionError("");

    try {
      const detail = await createArenaChallenge(roomId, payload);
      setIsArenaCreateOpen(false);
      setArenaTab("open");
      setArenaSelectedChallengeId(detail?.challenge?.id || "");
      setArenaSelectedChallengeDetail(detail || null);
      await loadArenaChallenges();
    } catch (error) {
      setArenaActionError(getApiErrorMessage(error, "Failed to create challenge."));
    } finally {
      setArenaActionBusy(false);
    }
  };

  const handleArenaSelectChallenge = useCallback((challenge) => {
    setArenaSelectedChallengeId(challenge?.id || "");
    setArenaActionError("");
  }, []);

  const handleArenaBackToFeed = useCallback(() => {
    setArenaSelectedChallengeId("");
    setArenaSelectedChallengeDetail(null);
    setArenaActionError("");
  }, []);

  const handleArenaSubmitEntry = async (content) => {
    if (!arenaSelectedChallengeId) return;

    setArenaActionBusy(true);
    setArenaActionError("");

    try {
      const detail = await submitArenaEntry(roomId, arenaSelectedChallengeId, {
        content,
      });
      setArenaSelectedChallengeDetail(detail || null);
      await loadArenaChallenges();
    } catch (error) {
      setArenaActionError(getApiErrorMessage(error, "Failed to submit entry."));
    } finally {
      setArenaActionBusy(false);
    }
  };

  const handleArenaVote = async (entryId) => {
    if (!arenaSelectedChallengeId) return;

    setArenaActionBusy(true);
    setArenaActionError("");

    try {
      const detail = await voteArenaEntry(roomId, arenaSelectedChallengeId, {
        entryId,
      });
      setArenaSelectedChallengeDetail(detail || null);
      await loadArenaChallenges();
    } catch (error) {
      setArenaActionError(getApiErrorMessage(error, "Failed to submit vote."));
    } finally {
      setArenaActionBusy(false);
    }
  };

  const handleArenaComment = async (content) => {
    if (!arenaSelectedChallengeId) return;

    setArenaActionBusy(true);
    setArenaActionError("");

    try {
      const detail = await createArenaComment(roomId, arenaSelectedChallengeId, {
        content,
      });
      setArenaSelectedChallengeDetail(detail || null);
    } catch (error) {
      setArenaActionError(
        getApiErrorMessage(error, "Failed to post battle comment.")
      );
    } finally {
      setArenaActionBusy(false);
    }
  };

  const sidebar = isArenaRoom || isBattleIt ? null : (
    <aside className="hidden xl:flex xl:w-[17.25rem] xl:shrink-0 xl:flex-col xl:border-r xl:border-white/5 xl:bg-neutral-900/95">
      <div className="room-panel-scroll min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5">
        <div className="space-y-2.5">
          {isChatRoom ? (
            <div className="overflow-hidden rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]">
              <DesktopTriviaSidebar
                room={room}
                status={status}
                sessionStatus={effectiveSessionStatus}
                sessionLabel={effectiveSessionLabel}
                sponsor={
                  hasSponsorPlacement(battleTriviaSponsor, "room-sidebar")
                    ? battleTriviaSponsor
                    : null
                }
                compact
              />
            </div>
          ) : null}

          {isBattleTrivia ? (
            <>
              <BattleTriviaProfileCard
                stats={profileStats}
                liveStreak={liveStreak}
                playerRank={playerRank}
                loading={isProfileStatsLoading}
                compact
              />

              <div className="overflow-hidden rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]">
                <BattleTriviaSessionSummaryCard
                  summary={sessionSummary}
                  loading={isSessionSummaryLoading}
                />
              </div>
            </>
          ) : isWordScramble ? (
            <>
              <WordScrambleProfileCard
                stats={wordScrambleState?.playerStats}
                playerRank={scramblePlayerRank?.rank ?? null}
                loading={!wordScrambleState}
              />

              <WordScrambleSessionCard
                state={wordScrambleState}
                currentUserId={user?.id}
                loading={!wordScrambleState}
              />
            </>
          ) : canModerateChat ? (
            <RoomModerationControlCard
              roomName={room?.name}
              slowModeSeconds={moderationState?.slowModeSeconds ?? 0}
              onUpdateSlowMode={handleUpdateSlowMode}
              moderationActions={moderationActions}
              isLoadingActions={isModerationActionsLoading}
            />
          ) : null}
        </div>
      </div>
    </aside>
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
      <div
        className={`mx-auto w-full max-w-[68rem] ${
          shouldCompactMobileChrome
            ? "px-2 pt-2 pb-1.5"
            : shouldCompactGameChrome
            ? "px-2.5 pt-2 pb-1 sm:px-4 sm:pt-2.5 sm:pb-1.5 lg:px-5"
            : "px-2.5 pt-10.5 pb-2 sm:px-4 sm:py-3 lg:px-5"
        }`}
      >
        <div className="hidden sm:block">
          <RoomUtilityBar
            room={room}
            user={user}
            sessionLabel={effectiveSessionLabel}
            isBattleTrivia={isBattleTrivia}
            isWordScramble={isWordScramble}
            compact={shouldCompactGameChrome}
          />
        </div>

        {!showGameSidebar ? (
          <MobileRoomMetaBar
            room={room}
            user={user}
            sessionLabel={effectiveSessionLabel}
            isBattleTrivia={isBattleTrivia}
            isWordScramble={isWordScramble}
          />
        ) : null}

        {isBattleTrivia && !shouldCompactMobileChrome && !shouldCompactGameChrome ? (
          <WeeklyWinnersCard data={weeklyWinners} />
        ) : null}

        {!shouldCompactMobileChrome && !shouldCompactGameChrome ? roomStateBanner : null}

        {isBattleTrivia &&
        hasSponsorPlacement(battleTriviaSponsor, "room-sidebar") ? (
          <div className="mb-3 xl:hidden">
            <SponsorSpotlightCard sponsor={battleTriviaSponsor} compact />
          </div>
        ) : null}

        {isArenaRoom ? (
          isArenaChallengeOpen ? (
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleArenaBackToFeed}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                <span aria-hidden="true">←</span>
                Back to battles
              </button>
            </div>
          ) : (
            <div className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_32%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(28,25,23,0.98)_45%,rgba(10,10,11,1)_100%)] p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-200">
                  RapNometry Arena
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-300">
                  Open mic battles
                </span>
              </div>

              <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                Challenge. Submit. Vote. Build your pen name.
              </div>

              <div className="mt-2 max-w-3xl text-sm leading-6 text-neutral-300">
                Post rap, poetry, spoken-word, and commentary challenges. The room submits entries, the crowd votes, and the best bars land in the Hall of Bars.
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {[
                  ["chat", "Chat"],
                  ["open", "Open"],
                  ["voting", "Voting"],
                  ["winners", "Winners"],
                  ["hall", "Hall of Bars"],
                  ["rankings", "Rankings"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setArenaTab(key)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      arenaTab === key
                        ? "bg-white text-neutral-950"
                        : "border border-white/10 bg-white/[0.04] text-neutral-200 hover:bg-white/[0.08]"
                    }`}
                  >
                    {label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsArenaCreateOpen(true)}
                  className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-950 sm:inline-flex"
                >
                  Create Challenge
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsArenaCreateOpen(true)}
                className="mt-3 inline-flex w-full items-center justify-center rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-neutral-950 shadow-[0_18px_34px_rgba(255,255,255,0.08)] sm:hidden"
              >
                Create Challenge
              </button>
            </div>
          )
        ) : null}

        {isBattleTrivia || (isBattleIt && battleItState?.status === "active") ? (
          <TriviaHeroCard
            currentRoundNumber={currentRoundNumber}
            sessionStatus={sessionStatus}
            timeLeft={timeLeft}
            currentQuestion={
              isBattleIt && currentQuestion
                ? {
                    ...currentQuestion,
                    totalQuestions:
                      currentQuestion.totalQuestions ?? battleItState?.questionCount,
                    sessionTitle:
                      currentQuestion.sessionTitle || battleItState?.title || "Battle It",
                  }
                : currentQuestion
            }
            correctAnswer={correctAnswer}
            roundWinners={roundWinners}
            isQuestionFresh={isQuestionFresh}
            isRoundReveal={isRoundReveal}
            hasActiveRound={!!currentRoundId}
            lastRoundPlacement={lastRoundPlacement}
            compact={shouldCompactGameChrome}
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
            compact={shouldCompactGameChrome}
          />
        ) : null}

        {isBattleIt && battleItState?.status === "active" ? (
          <div className="mt-2">
            <BattleItPanel
              roomId={roomId}
              state={battleItState}
              onStateChange={setBattleItState}
              halftime={battleItHalftime}
              leaderboard={leaderboard}
              currentRoundNumber={currentRoundNumber}
            />
          </div>
        ) : null}
      </div>
    </div>
  );

  const chatStream = (
    <ChatStream
      messages={messages}
      pinnedMessage={pinnedMessage}
      variant={isChatRoom ? "general-chat" : "default"}
      currentUserId={user?.id}
      currentUsername={user?.username}
      error={displayError}
      isLoading={isLoadingRoom}
      loadingOlder={isChatRoom ? isLoadingOlder : false}
      hasOlderMessages={isChatRoom ? hasOlderMessages : false}
      onLoadOlder={isChatRoom ? handleLoadOlderMessages : undefined}
      onRequestMessageFocus={isChatRoom ? focusMessageInStream : undefined}
      containerRef={messagesContainerRef}
      onScroll={updateAutoScrollState}
      bottomAlign={showGameSidebar}
      compact={shouldCompactGameChrome}
      isAdmin={canModerateChat}
      onDeleteMessage={handleDeleteMessage}
      onMuteUser={handleMuteUser}
      onReplyMessage={!showGameSidebar ? handleReplyMessage : undefined}
      onEditMessage={!showGameSidebar ? handleEditMessage : undefined}
      onToggleReaction={!showGameSidebar ? handleToggleReaction : undefined}
      onPinMessage={
        !showGameSidebar && canModerateChat ? handlePinMessage : undefined
      }
      onUnpinMessage={
        !showGameSidebar && canModerateChat ? handleUnpinMessage : undefined
      }
    />
  );

  const stream =
    isBattleIt && battleItState?.status !== "active" ? (
      <div className="room-panel-scroll min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="mx-auto w-full max-w-[68rem]">
          <BattleItPanel
            roomId={roomId}
            state={battleItState}
            onStateChange={setBattleItState}
            halftime={battleItHalftime}
            leaderboard={leaderboard}
            currentRoundNumber={currentRoundNumber}
          />
        </div>
      </div>
    ) : isArenaRoom && arenaTab !== "chat" ? (
      <ArenaRoomPanel
        activeTab={arenaTab}
        onTabChange={setArenaTab}
        challenges={arenaChallenges}
        selectedChallenge={arenaSelectedChallengeDetail}
        onSelectChallenge={handleArenaSelectChallenge}
        hallOfBars={arenaHallOfBars}
        leaderboard={arenaLeaderboardRows}
        arenaNotice={arenaNotice}
        actionBusy={arenaActionBusy}
        actionError={arenaActionError || arenaError}
        currentUserId={user?.id}
        onBackFromChallenge={handleArenaBackToFeed}
        onSubmitEntry={handleArenaSubmitEntry}
        onVote={handleArenaVote}
        onComment={handleArenaComment}
        onCreateChallenge={() => setIsArenaCreateOpen(true)}
        loading={arenaLoading}
        showToolbar={false}
      />
    ) : (
      chatStream
    );

  const isBattleItMultipleChoice =
    isBattleIt &&
    battleItState?.status === "active" &&
    (currentQuestion?.answerMode || battleItState?.answerMode) ===
      "multiple-choice";

  const chatFooter = (
    <RoomFooterBar
      whisper={
        isTriviaAnswerRoom ? (
          <TriviaWhisperStatus
            answerFeedback={answerFeedback}
            attemptsInfo={attemptsInfo}
            currentRoundId={currentRoundId}
            singleChoice={isBattleItMultipleChoice}
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
        ) : slowModeBlockMessage ? (
          <div className="flex items-center justify-between gap-3 rounded-[16px] border border-blue-400/25 bg-blue-500/12 px-3 py-2 text-sm text-blue-100 shadow-[0_10px_24px_rgba(37,99,235,0.16)]">
            <span>{slowModeBlockMessage}</span>
            <span className="rounded-full border border-blue-200/20 bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100">
              Cooldown
            </span>
          </div>
        ) : slowModeMessage ? (
          <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-neutral-300">
            {slowModeMessage}
          </div>
        ) : null
      }
      composer={
        isBattleItMultipleChoice ? (
          <BattleItAnswerOptions
            key={currentRoundId || "waiting"}
            roundId={currentRoundId}
            options={currentQuestion?.answerOptions || []}
            onSelect={handleSend}
            disabled={status !== "connected" || isLoadingRoom}
          />
        ) : (
          <ChatInput
          onSend={handleSend}
          replyTarget={!showGameSidebar ? replyTarget : null}
          onCancelReply={!showGameSidebar ? handleCancelReply : undefined}
          mentionUsers={!showGameSidebar ? mentionUsers : []}
          placeholder={
            isTriviaAnswerRoom
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
              : replyTarget
              ? "Write your reply..."
              : "Type a message..."
          }
          buttonLabel={
            isTriviaAnswerRoom
              ? currentRoundId
                ? "Answer"
                : "Waiting..."
              : isWordScramble
              ? wordScrambleState?.roundId &&
                wordScrambleState?.phase === "active"
                ? "Guess"
                : "Waiting..."
              : replyTarget
              ? "Reply"
              : "Send"
          }
          busyLabel={
            isTriviaAnswerRoom
              ? "Answering..."
              : isWordScramble
              ? "Guessing..."
              : replyTarget
              ? "Replying..."
              : "Sending..."
          }
          disabled={
            status !== "connected" ||
            isLoadingRoom ||
            (isTriviaAnswerRoom && !currentRoundId) ||
            (isWordScramble &&
              (!wordScrambleState?.roundId ||
                wordScrambleState?.phase !== "active")) ||
            (!showGameSidebar &&
              (Boolean(mutedBannerMessage) || isModerationStateLoading))
          }
          />
        )
      }
    />
  );

  const footer =
    (isArenaRoom && arenaTab !== "chat") ||
    (isBattleIt && battleItState?.status !== "active")
      ? null
      : chatFooter;

  return (
    <div
      className={`room-page fixed inset-x-0 overflow-hidden overscroll-none bg-neutral-950 text-white ${
        isLight ? "room-page--light" : ""
      }`}
      style={{
        ...lightModeUndoFilter,
        top: `${viewportState.offsetTop}px`,
        height: viewportState.height
          ? `${viewportState.height}px`
          : "100dvh",
      }}
    >
      {!isKeyboardOpen ? (
        <MobileFloatingRoomNav
          compact={shouldCompactMobileChrome}
          roomBadgeLabel={isArenaRoom ? "RapNometry Arena" : ""}
          roomBadgeClassName={
            isArenaRoom
              ? "border-orange-400/20 bg-orange-500/10 text-orange-200"
              : ""
          }
        />
      ) : null}

      <RoomShell
        sidebar={sidebar}
        header={null}
        topContent={topContent}
        stream={stream}
        footer={footer}
      />

      <MentionToastStack
        items={mentionToasts}
        onDismiss={handleJumpToMentionMessage}
      />

      <AchievementToastStack achievements={achievementUnlocks} />

      <ArenaCreateChallengeModal
        open={isArenaCreateOpen}
        onClose={() => {
          setIsArenaCreateOpen(false);
          setArenaActionError("");
        }}
        onSubmit={handleArenaCreateChallenge}
        busy={arenaActionBusy}
        error={arenaActionError}
      />
    </div>
  );
}
