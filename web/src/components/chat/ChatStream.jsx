import { useCallback, useRef } from "react";
import ChatMessage from "./ChatMessage";

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
          💬
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

function StreamHeader({ count }) {
  return (
    <div className="sticky top-0 z-[2] mb-3 bg-[linear-gradient(180deg,rgba(10,10,10,0.94),rgba(10,10,10,0.82),rgba(10,10,10,0))] pb-3 pt-1 backdrop-blur-md">
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
    <div className="mb-3 flex justify-center">
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
    <div className="sticky top-0 z-[20] mb-3 rounded-[18px] border border-amber-400/15 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(245,158,11,0.03))] px-3 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.12)] backdrop-blur-md sm:px-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onJumpToMessage?.(message.id)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-amber-200/80">
            Pinned message
          </div>
          <div className="mt-1 text-sm font-medium text-white">
            {message.displayName || message.username || "Unknown"}
          </div>
          <div className="mt-1 truncate text-[12px] text-amber-100/75">
            {message.messageText}
          </div>
        </button>

        {isAdmin && typeof onUnpinMessage === "function" ? (
          <button
            type="button"
            onClick={() => onUnpinMessage(message.id)}
            className="shrink-0 rounded-full border border-amber-300/18 bg-amber-300/10 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-300/14"
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
}) {
  const messageCount = Array.isArray(messages) ? messages.length : 0;
  const messageRefs = useRef(new Map());

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

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#090909_0%,#0a0a0a_24%,#090909_100%)]"
    >
      <div className="mx-auto flex w-full max-w-[64rem] flex-col px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
        <StreamErrorBanner error={error} />

        {isLoading ? (
          <StreamLoadingState />
        ) : messageCount === 0 ? (
          <StreamEmptyState />
        ) : (
          <>
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

            <StreamHeader count={messageCount} />

            <div className="rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.008))] px-2 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.14)] sm:px-3 sm:py-3">
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
                  />
                ))}
              </div>
            </div>

            <div className="h-5 sm:h-6" />
          </>
        )}
      </div>
    </div>
  );
}
