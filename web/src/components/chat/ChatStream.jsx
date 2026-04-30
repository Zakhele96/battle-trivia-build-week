import { useCallback, useRef } from "react";
import ChatMessage from "./ChatMessage";

const GENERAL_CHAT_BUBBLE_TONES = [
  {
    id: "teal",
    bubbleClass:
      "border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(19,78,74,0.98),rgba(17,94,89,0.98))] text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]",
    senderClass: "text-cyan-200",
    timestampClass: "text-white/72",
  },
  {
    id: "plum",
    bubbleClass:
      "border border-fuchsia-300/16 bg-[linear-gradient(180deg,rgba(88,28,135,0.98),rgba(107,33,168,0.98))] text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]",
    senderClass: "text-fuchsia-200",
    timestampClass: "text-white/72",
  },
  {
    id: "slate",
    bubbleClass:
      "border border-sky-200/14 bg-[linear-gradient(180deg,rgba(30,41,59,0.98),rgba(37,99,235,0.78))] text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]",
    senderClass: "text-sky-200",
    timestampClass: "text-white/72",
  },
  {
    id: "forest",
    bubbleClass:
      "border border-emerald-300/16 bg-[linear-gradient(180deg,rgba(20,83,45,0.98),rgba(22,101,52,0.98))] text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]",
    senderClass: "text-emerald-200",
    timestampClass: "text-white/72",
  },
  {
    id: "rose",
    bubbleClass:
      "border border-rose-300/16 bg-[linear-gradient(180deg,rgba(127,29,29,0.98),rgba(159,18,57,0.96))] text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]",
    senderClass: "text-rose-200",
    timestampClass: "text-white/72",
  },
];

function StreamStatusPill({ children }) {
  return (
    <div className="inline-flex items-center justify-center rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
      {children}
    </div>
  );
}

function StreamErrorBanner({ error }) {
  if (!error) return null;

  return (
    <div className="mb-3 rounded-[18px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90 shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
      {error}
    </div>
  );
}

function StreamLoadingState() {
  return (
    <div className="rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.012))] px-4 py-8 sm:px-5 sm:py-10">
      <div className="flex justify-center">
        <StreamStatusPill>Connecting stream</StreamStatusPill>
      </div>
    </div>
  );
}

function StreamEmptyState() {
  return (
    <div className="rounded-[22px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.06),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-8 text-center sm:px-5 sm:py-10">
      <div className="flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lg">
          <span className="emoji-native">💬</span>
        </div>
      </div>

      <div className="mt-4 text-[15px] font-semibold text-white sm:text-base">
        No messages yet
      </div>

      <div className="mx-auto mt-2 max-w-[28rem] text-sm leading-6 text-neutral-500">
        Start the conversation. Messages, answers, and live room activity will
        appear here in real time.
      </div>
    </div>
  );
}

function StreamHeader({ count, compact = false }) {
  return (
    <div
      className={`sticky top-0 z-[2] bg-[linear-gradient(180deg,rgba(10,10,10,0.94),rgba(10,10,10,0.82),rgba(10,10,10,0))] backdrop-blur-md ${
        compact ? "mb-2 pb-1.5 pt-0" : "mb-2.5 pb-2.5 pt-0.5"
      }`}
    >
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
          Live stream
          {count > 0 ? <span className="text-neutral-600">•</span> : null}
          {count > 0 ? <span>{count}</span> : null}
        </div>
      </div>
    </div>
  );
}

function StreamHistoryLoader({
  hasOlderMessages,
  loadingOlder,
  onLoadOlder,
}) {
  if (!hasOlderMessages && !loadingOlder) return null;

  return (
    <div className="mb-2.5 flex justify-center">
      {loadingOlder ? (
        <StreamStatusPill>Loading older messages</StreamStatusPill>
      ) : (
        <button
          type="button"
          onClick={onLoadOlder}
          className="inline-flex items-center justify-center rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-neutral-400 transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white"
        >
          Load older messages
        </button>
      )}
    </div>
  );
}

function PinnedMessageBar({ message, onJumpToMessage, onUnpinMessage, isAdmin }) {
  if (!message) return null;

  return (
    <div className="sticky top-0 z-[20] mb-3 overflow-hidden rounded-[22px] border border-amber-200/18 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.08),transparent_32%),linear-gradient(180deg,rgba(85,50,21,0.24),rgba(24,16,10,0.92))] px-3 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.22)] backdrop-blur-md sm:px-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="rounded-full border border-amber-100/18 bg-amber-50/8 px-2 py-[0.35rem] text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-50/88">
          Pinned message
        </div>
        <div className="text-[9px] uppercase tracking-[0.15em] text-amber-50/62">
          Shared with everyone in this room
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onJumpToMessage?.(message.id)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="text-sm font-semibold text-white">
            {message.displayName || message.username || "Unknown"}
          </div>
          <div className="mt-1 line-clamp-2 text-[13px] leading-5 text-amber-50/86">
            {message.messageText}
          </div>
        </button>

        {isAdmin && typeof onUnpinMessage === "function" ? (
          <button
            type="button"
            onClick={() => onUnpinMessage(message.id)}
            className="shrink-0 rounded-full border border-amber-100/14 bg-amber-50/8 px-2 py-[0.35rem] text-[9px] font-medium uppercase tracking-[0.14em] text-amber-50/82 transition hover:bg-amber-50/12"
          >
            Unpin
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function ChatStream({
  messages,
  pinnedMessage,
  variant = "default",
  currentUserId,
  currentUsername,
  error,
  isLoading,
  containerRef,
  onScroll,
  isAdmin = false,
  onDeleteMessage,
  onMuteUser,
  onReplyMessage,
  onEditMessage,
  onToggleReaction,
  onPinMessage,
  onUnpinMessage,
  onLoadOlder,
  onRequestMessageFocus,
  hasOlderMessages = false,
  loadingOlder = false,
  bottomAlign = false,
  compact = false,
}) {
  const messageCount = Array.isArray(messages) ? messages.length : 0;
  const messageRefs = useRef(new Map());
  const toneAssignmentsRef = useRef(new Map());

  const setMessageNodeRef = useCallback((messageId, node) => {
    if (!messageId) return;

    if (node) {
      messageRefs.current.set(messageId, node);
    } else {
      messageRefs.current.delete(messageId);
    }
  }, []);

  const jumpToMessage = useCallback((messageId) => {
    if (!messageId) return;

    const node = messageRefs.current.get(messageId);
    if (!node) {
      onRequestMessageFocus?.(messageId);
      return;
    }

    node.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [onRequestMessageFocus]);

  const getBubbleTone = useCallback(
    (message) => {
      if (
        variant !== "general-chat" ||
        !message?.userId ||
        message.userId === currentUserId ||
        message.isAdmin === true
      ) {
        return null;
      }

      const existingTone = toneAssignmentsRef.current.get(message.userId);
      if (existingTone) {
        return existingTone;
      }

      const nextTone =
        GENERAL_CHAT_BUBBLE_TONES[
          Math.floor(Math.random() * GENERAL_CHAT_BUBBLE_TONES.length)
        ];

      toneAssignmentsRef.current.set(message.userId, nextTone);
      return nextTone;
    },
    [currentUserId, variant]
  );

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className={`room-stream-scroll h-full min-h-0 flex-1 overflow-y-auto scroll-smooth ${
        variant === "general-chat"
          ? "bg-[radial-gradient(circle_at_top_left,rgba(10,132,255,0.08),transparent_26%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_24%),linear-gradient(180deg,#070809_0%,#0a0a0a_24%,#090909_100%)]"
          : "bg-[linear-gradient(180deg,#090909_0%,#0a0a0a_24%,#090909_100%)]"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-[64rem] flex-col px-3 sm:px-4 lg:px-5 ${
          bottomAlign
            ? compact
              ? "min-h-full pt-1 pb-1 sm:pt-1.5 sm:pb-2"
              : "min-h-full py-2 sm:py-3 lg:py-4"
            : "py-2.5 sm:py-4 lg:py-5"
        }`}
      >
        <StreamErrorBanner error={error} />

        {isLoading ? (
          <StreamLoadingState />
        ) : messageCount === 0 ? (
          <StreamEmptyState />
        ) : (
          <div className={bottomAlign ? "mt-auto" : ""}>
            <StreamHistoryLoader
              hasOlderMessages={hasOlderMessages}
              loadingOlder={loadingOlder}
              onLoadOlder={onLoadOlder}
            />

            <PinnedMessageBar
              message={pinnedMessage}
              onJumpToMessage={jumpToMessage}
              onUnpinMessage={onUnpinMessage}
              isAdmin={isAdmin}
            />

            <StreamHeader count={messageCount} compact={compact && bottomAlign} />

            <div
              className={`rounded-[22px] px-1.5 py-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.14)] sm:rounded-[24px] sm:px-3 sm:py-3 ${
                variant === "general-chat"
                  ? "border border-white/7 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.03),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.024),rgba(255,255,255,0.008))]"
                  : "border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.008))]"
              }`}
            >
              <div className="space-y-0">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    currentUserId={currentUserId}
                    currentUsername={currentUsername}
                    previousMessage={index > 0 ? messages[index - 1] : null}
                    nextMessage={
                      index < messages.length - 1 ? messages[index + 1] : null
                    }
                    isAdmin={isAdmin}
                    onDeleteMessage={onDeleteMessage}
                    onMuteUser={onMuteUser}
                    onReplyMessage={onReplyMessage}
                    onEditMessage={onEditMessage}
                    onToggleReaction={onToggleReaction}
                    onPinMessage={onPinMessage}
                    onUnpinMessage={onUnpinMessage}
                    onJumpToMessage={jumpToMessage}
                    messageNodeRef={(node) => setMessageNodeRef(message.id, node)}
                    variant={variant}
                    bubbleTone={getBubbleTone(message)}
                  />
                ))}
              </div>
            </div>

            <div className="h-5 sm:h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
