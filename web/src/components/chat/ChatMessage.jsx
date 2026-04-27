import { useEffect, useRef, useState } from "react";

const LONG_PRESS_MS = 420;

const REACTION_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥"];

function formatTime(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isSameSender(a, b) {
  if (!a || !b) return false;
  if (a.messageType !== "user" || b.messageType !== "user") return false;
  return a.userId && b.userId && a.userId === b.userId;
}

function getSystemTone(text) {
  const value = (text || "").toLowerCase();

  if (value.includes("correct answer") || value.includes("answer revealed")) {
    return {
      dot: "bg-emerald-300/80",
      text: "text-emerald-200/75",
      line: "bg-emerald-400/10",
      badge: "text-emerald-200/60",
      shell:
        "border-emerald-400/10 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(16,185,129,0.03))]",
    };
  }

  if (
    value.includes("winner") ||
    value.includes("points") ||
    value.includes("leaderboard")
  ) {
    return {
      dot: "bg-violet-300/80",
      text: "text-violet-200/75",
      line: "bg-violet-400/10",
      badge: "text-violet-200/60",
      shell:
        "border-violet-400/10 bg-[linear-gradient(180deg,rgba(168,85,247,0.08),rgba(168,85,247,0.03))]",
    };
  }

  if (value.includes("started")) {
    return {
      dot: "bg-blue-300/80",
      text: "text-blue-200/75",
      line: "bg-blue-400/10",
      badge: "text-blue-200/60",
      shell:
        "border-blue-400/10 bg-[linear-gradient(180deg,rgba(59,130,246,0.08),rgba(59,130,246,0.03))]",
    };
  }

  if (value.includes("ended")) {
    return {
      dot: "bg-amber-300/80",
      text: "text-amber-200/75",
      line: "bg-amber-400/10",
      badge: "text-amber-200/60",
      shell:
        "border-amber-400/10 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(245,158,11,0.03))]",
    };
  }

  return {
    dot: "bg-neutral-400/80",
    text: "text-neutral-400",
    line: "bg-white/8",
    badge: "text-neutral-500",
    shell:
      "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]",
  };
}

function getSystemLabel(text) {
  const value = (text || "").toLowerCase();

  if (value.includes("correct answer") || value.includes("answer revealed")) {
    return "Answer";
  }

  if (
    value.includes("winner") ||
    value.includes("points") ||
    value.includes("leaderboard")
  ) {
    return "Score";
  }

  if (value.includes("started")) {
    return "Live";
  }

  if (value.includes("ended")) {
    return "End";
  }

  return "Update";
}

function ReplyPreview({ message, isMine, onJumpToMessage }) {
  if (!message?.replyToMessageId) return null;

  const previewAuthor =
    message.replyToDisplayName || message.replyToUsername || "Message";

  const previewText =
    message.replyToPreviewText || "Tap to view replied message.";

  return (
    <button
      type="button"
      onClick={() => onJumpToMessage?.(message.replyToMessageId)}
      className={`mb-1.5 w-full rounded-[14px] border px-3 py-2 text-left transition ${
        isMine
          ? "border-white/14 bg-white/10 hover:bg-white/14"
          : "border-white/8 bg-white/[0.04] hover:bg-white/[0.06]"
      }`}
    >
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/70">
        Replying to {previewAuthor}
      </div>
      <div className="mt-1 truncate text-[12px] text-white/80">
        {previewText}
      </div>
    </button>
  );
}

function ReactionBar({
  reactions,
  onToggleReaction,
  onOpenPicker,
  busyAction,
  isMine,
}) {
  const safeReactions = Array.isArray(reactions) ? reactions : [];
  const hasReactions = safeReactions.length > 0;

  if (!hasReactions && !onToggleReaction) return null;

  return (
    <div
      className={`mt-1.5 flex max-w-full flex-wrap items-center gap-1.5 ${
        isMine ? "justify-end" : "justify-start"
      }`}
    >
      {safeReactions.map((reaction) => (
        <button
          key={`${reaction.emoji}-${reaction.count}`}
          type="button"
          disabled={!!busyAction}
          onClick={() => onToggleReaction?.(reaction.emoji)}
          className={`inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[10px] transition sm:h-auto sm:px-2 sm:py-1 sm:text-[11px] ${
            reaction.reactedByMe
              ? "border-emerald-300/30 bg-emerald-400/12 text-emerald-100"
              : "border-white/10 bg-white/[0.04] text-neutral-300 hover:bg-white/[0.06]"
          } disabled:opacity-50`}
        >
          <span className="emoji-native">{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}

      {onOpenPicker ? (
        <button
          type="button"
          disabled={!!busyAction}
          onClick={onOpenPicker}
          className="inline-flex h-7 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 text-[10px] text-neutral-300 transition hover:bg-white/[0.06] disabled:opacity-50 sm:h-auto sm:px-2 sm:py-1 sm:text-[11px]"
        >
          <span className="text-[12px] leading-none">+</span>
          <span className="hidden sm:inline">React</span>
        </button>
      ) : null}
    </div>
  );
}

function renderMessageText(text, currentUsername, options = {}) {
  const value = text || "";
  const { vivid = false } = options;
  const parts = [];
  const regex = /(^|\s)(@[a-zA-Z0-9._-]+)/g;
  let lastIndex = 0;
  let keyIndex = 0;
  let match;

  while ((match = regex.exec(value)) !== null) {
    const leadingWhitespace = match[1] || "";
    const mention = match[2] || "";
    const matchStart = match.index;
    const mentionStart = matchStart + leadingWhitespace.length;

    if (matchStart > lastIndex) {
      parts.push(value.slice(lastIndex, matchStart));
    }

    if (leadingWhitespace) {
      parts.push(leadingWhitespace);
    }

    const normalizedMention = mention.slice(1).toLowerCase();
    const isCurrentUserMention =
      !!currentUsername &&
      normalizedMention === String(currentUsername).toLowerCase();

    parts.push(
      <span
        key={`mention-${keyIndex++}`}
        className={`rounded-full px-1.5 py-0.5 font-medium ${
          isCurrentUserMention
            ? vivid
              ? "bg-white/18 text-white"
              : "bg-amber-300/16 text-amber-100"
            : vivid
            ? "bg-white/12 text-white"
            : "bg-white/10 text-blue-100"
        }`}
      >
        {mention}
      </span>
    );

    lastIndex = mentionStart + mention.length;
  }

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts;
}

export default function ChatMessage({
  message,
  currentUserId,
  currentUsername,
  previousMessage,
  nextMessage,
  isAdmin = false,
  onDeleteMessage,
  onMuteUser,
  onReplyMessage,
  onEditMessage,
  onToggleReaction,
  onPinMessage,
  onUnpinMessage,
  onJumpToMessage,
  messageNodeRef,
  variant = "default",
  bubbleTone = null,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.messageText || "");
  const menuRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const isSystem = message.messageType === "system";
  const isMine = message.userId === currentUserId;
  const isMessageFromModerator = message.isAdmin === true;
  const isSupporterMessage = message.isSupporter === true;
  const supporterBadgeLabel = message.supporterBadgeLabel || "Supporter";
  const isPinned = message.isPinned === true;
  const currentUserReaction =
    Array.isArray(message.reactions)
      ? message.reactions.find((reaction) => reaction.reactedByMe)?.emoji ?? ""
      : "";

  const groupedWithPrevious = isSameSender(message, previousMessage);
  const groupedWithNext = isSameSender(message, nextMessage);

  useEffect(() => {
    setEditText(message.messageText || "");
  }, [message.messageText]);

  useEffect(() => {
    if (!menuOpen && !pickerOpen) return;

    function handleClickOutside(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
        setPickerOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setPickerOpen(false);
        setIsEditing(false);
        setEditText(message.messageText || "");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, pickerOpen, message.messageText]);

  if (isSystem) {
    const tone = getSystemTone(message.messageText);
    const label = getSystemLabel(message.messageText);

    return (
      <div className="my-3 flex items-center justify-center px-1 sm:my-4">
        <div className="flex w-full max-w-[38rem] items-center gap-2.5 sm:gap-3">
          <div className={`h-px flex-1 ${tone.line}`} />

          <div
            className={`flex min-w-0 items-center gap-2 rounded-full border px-2.5 py-1.5 backdrop-blur-sm ${tone.shell}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />

            <span
              className={`shrink-0 text-[9px] font-medium uppercase tracking-[0.16em] ${tone.badge}`}
            >
              {label}
            </span>

            <span className={`truncate text-[10px] sm:text-[11px] ${tone.text}`}>
              {message.messageText}
            </span>
          </div>

          <div className={`h-px flex-1 ${tone.line}`} />
        </div>
      </div>
    );
  }

  const canModerateMessage =
    isAdmin && message.messageType === "user" && !!message.userId && !isMine;

  const canEditMessage = isMine && typeof onEditMessage === "function";
  const canPinMessage = isAdmin && typeof onPinMessage === "function";
  const canUnpinMessage = isAdmin && typeof onUnpinMessage === "function";

  const bubbleBase =
    "flex min-w-[5.5rem] w-fit max-w-[78%] sm:max-w-[72%] lg:max-w-[40rem] flex-col px-2.5 pb-2 pt-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.14)] transition-all duration-200";

  const mineStyles = isMessageFromModerator
    ? "bg-[linear-gradient(180deg,rgba(88,101,242,1)_0%,rgba(64,78,237,1)_100%)] text-white ring-1 ring-violet-300/25"
    : isSupporterMessage
    ? "bg-[linear-gradient(180deg,rgba(245,158,11,0.96)_0%,rgba(217,119,6,0.96)_45%,rgba(29,78,216,0.96)_100%)] text-white ring-1 ring-amber-200/30"
    : "bg-[linear-gradient(180deg,rgba(55,149,255,1)_0%,rgba(10,132,255,1)_100%)] text-white";

  const theirsStyles = isMessageFromModerator
    ? "border border-violet-400/15 bg-[linear-gradient(180deg,rgba(58,49,94,0.92)_0%,rgba(41,35,68,0.96)_100%)] text-violet-50"
    : isSupporterMessage
    ? "border border-amber-300/18 bg-[linear-gradient(180deg,rgba(91,58,18,0.96)_0%,rgba(52,36,14,0.98)_55%,rgba(19,33,62,0.98)_100%)] text-amber-50 shadow-[0_10px_24px_rgba(245,158,11,0.1)]"
    : bubbleTone?.bubbleClass ||
      "border border-white/[0.05] bg-[linear-gradient(180deg,rgba(46,46,49,0.98),rgba(34,34,37,0.98))] text-neutral-100";

  const usesVividBubble =
    isMine ||
    isMessageFromModerator ||
    (variant === "general-chat" && !!bubbleTone);

  const senderTextClass = isMessageFromModerator
    ? "text-violet-100/90"
    : isSupporterMessage
    ? "text-amber-50/92"
    : usesVividBubble
    ? "text-white/90"
    : bubbleTone?.senderClass
    ? bubbleTone.senderClass
    : "text-neutral-300";

  const timestampTextClass = isMessageFromModerator
    ? isMine
      ? "text-violet-100/82"
      : "text-violet-100/76"
    : usesVividBubble
    ? "text-white/74"
    : bubbleTone?.timestampClass
    ? bubbleTone.timestampClass
    : "text-neutral-500";

  const roundedClass = isMine
    ? groupedWithPrevious && groupedWithNext
      ? "rounded-[20px] rounded-br-md"
      : groupedWithPrevious
      ? "rounded-[20px] rounded-tr-[20px] rounded-br-md"
      : groupedWithNext
      ? "rounded-[20px] rounded-br-[20px]"
      : "rounded-[20px]"
    : groupedWithPrevious && groupedWithNext
    ? "rounded-[20px] rounded-bl-md"
    : groupedWithPrevious
    ? "rounded-[20px] rounded-tl-[20px] rounded-bl-md"
    : groupedWithNext
    ? "rounded-[20px] rounded-bl-[20px]"
    : "rounded-[20px]";

  async function handleDelete() {
    if (!onDeleteMessage || !message.id || busyAction) return;

    try {
      setBusyAction("delete");
      await onDeleteMessage(message.id);
      setMenuOpen(false);
    } finally {
      setBusyAction("");
    }
  }

  async function handleMute(minutes) {
    if (!onMuteUser || !message.userId || busyAction) return;

    try {
      setBusyAction(`mute-${minutes}`);
      await onMuteUser(message.userId, minutes);
      setMenuOpen(false);
    } finally {
      setBusyAction("");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.messageText || "");
      setMenuOpen(false);
    } catch {
      setMenuOpen(false);
    }
  }

  async function handleSaveEdit() {
    const trimmed = editText.trim();
    if (!trimmed || !message.id || !onEditMessage || busyAction) return;

    try {
      setBusyAction("edit");
      await onEditMessage(message.id, trimmed);
      setIsEditing(false);
      setMenuOpen(false);
    } finally {
      setBusyAction("");
    }
  }

  async function handleToggleReaction(emoji) {
    if (!message.id || !onToggleReaction || busyAction) return;

    try {
      setBusyAction(`react-${emoji}`);
      await onToggleReaction(message.id, emoji);
      setPickerOpen(false);
    } finally {
      setBusyAction("");
    }
  }

  async function handlePinToggle() {
    if (!message.id || busyAction) return;

    try {
      setBusyAction(isPinned ? "unpin" : "pin");
      if (isPinned) {
        await onUnpinMessage?.(message.id);
      } else {
        await onPinMessage?.(message.id);
      }
      setMenuOpen(false);
    } finally {
      setBusyAction("");
    }
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function startLongPressMenu() {
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      setMenuOpen(true);
      setPickerOpen(false);
    }, LONG_PRESS_MS);
  }

  const editedLabel =
    message.isEdited || message.editedAt ? " · edited" : "";

  return (
    <div
      ref={messageNodeRef}
      id={`message-${message.id}`}
      className={`${groupedWithPrevious ? "mt-1" : "mt-3 sm:mt-4"} flex w-full ${
        isMine ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`group relative flex w-full max-w-full flex-col ${
          isMine ? "items-end" : "items-start"
        }`}
        ref={menuRef}
      >
        <div className={`relative flex max-w-full flex-col ${isMine ? "items-end" : "items-start"}`}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setPickerOpen(false);
            }}
            className={`absolute -top-2 z-[3] hidden rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-neutral-200 backdrop-blur-sm transition hover:bg-black/72 hover:text-white sm:inline-flex sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 ${
              isMine ? "-right-2" : "-left-2"
            }`}
          >
            •••
          </button>

          {menuOpen ? (
            <div className={`absolute z-[4] w-44 max-w-[calc(100vw-1rem)] rounded-2xl border border-white/10 bg-neutral-900 p-1.5 shadow-xl shadow-black/30 ${
              isMine ? "right-0 top-[calc(100%+0.5rem)]" : "left-0 top-[calc(100%+0.5rem)]"
            }`}>
              <button
                type="button"
                onClick={() => {
                  onReplyMessage?.(message);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs text-white transition hover:bg-white/[0.06]"
              >
                Reply
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs text-white transition hover:bg-white/[0.06] disabled:opacity-50"
              >
                Copy text
              </button>

              {canEditMessage ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs text-white transition hover:bg-white/[0.06]"
                >
                  Edit message
                </button>
              ) : null}

              {canPinMessage || (isPinned && canUnpinMessage) ? (
                <button
                  type="button"
                  onClick={handlePinToggle}
                  disabled={!!busyAction}
                  className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs text-white transition hover:bg-white/[0.06] disabled:opacity-50"
                >
                  {busyAction === "pin"
                    ? "Pinning..."
                    : busyAction === "unpin"
                    ? "Unpinning..."
                    : isPinned
                    ? "Unpin message"
                    : "Pin message"}
                </button>
              ) : null}

              {canModerateMessage ? (
                <>
                  <button
                    type="button"
                    disabled={!!busyAction}
                    onClick={handleDelete}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs text-white transition hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {busyAction === "delete" ? "Deleting..." : "Delete message"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMute(10)}
                    disabled={!!busyAction}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs text-white transition hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {busyAction === "mute-10" ? "Muting..." : "Mute 10 min"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMute(60)}
                    disabled={!!busyAction}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs text-white transition hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {busyAction === "mute-60" ? "Muting..." : "Mute 1 hour"}
                  </button>
                </>
              ) : null}
            </div>
          ) : null}

          {pickerOpen ? (
            <div className={`absolute z-[4] max-w-[calc(100vw-1rem)] overflow-x-auto rounded-full border border-white/10 bg-neutral-950/96 px-2 py-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl ${
              isMine ? "right-0 bottom-[calc(100%+0.5rem)]" : "left-0 bottom-[calc(100%+0.5rem)]"
            }`}>
              <div className="flex min-w-max items-center gap-1">
                {REACTION_OPTIONS.map((emoji) => {
                  const isSelected = currentUserReaction === emoji;

                  return (
                    <button
                      key={emoji}
                      type="button"
                      disabled={!!busyAction}
                      onClick={() => handleToggleReaction(emoji)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-[20px] transition duration-150 hover:-translate-y-0.5 hover:bg-white/[0.06] disabled:opacity-50 ${
                        isSelected ? "bg-white/[0.08] ring-1 ring-emerald-300/30" : ""
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span className="emoji-native">{emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div
            onTouchStart={startLongPressMenu}
            onTouchEnd={clearLongPressTimer}
            onTouchMove={clearLongPressTimer}
            onTouchCancel={clearLongPressTimer}
            className={`${bubbleBase} ${roundedClass} ${
              isMine ? mineStyles : theirsStyles
            }`}
          >
          {!groupedWithPrevious ? (
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <div
                className={`text-[10px] font-semibold tracking-[0.01em] ${senderTextClass}`}
              >
                {isMine ? "You" : message.displayName || message.username || "Unknown"}
              </div>

              {isMessageFromModerator ? (
                <span className="rounded-full border border-violet-300/20 bg-violet-300/12 px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-100">
                  Mod
                </span>
              ) : null}

              {isSupporterMessage ? (
                <span className="rounded-full border border-amber-200/20 bg-amber-300/14 px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-50">
                  {supporterBadgeLabel}
                </span>
              ) : null}

              {isPinned ? (
                <span className="rounded-full border border-amber-100/18 bg-amber-50/8 px-2 py-[2px] text-[8px] font-semibold uppercase tracking-[0.14em] text-amber-50/88">
                  Pinned
                </span>
              ) : null}
            </div>
          ) : null}

          <ReplyPreview
            message={message}
            isMine={isMine}
            onJumpToMessage={onJumpToMessage}
          />

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-[14px] border border-white/12 bg-black/20 px-3 py-2 text-[14px] leading-[1.5] text-white outline-none"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(message.messageText || "");
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/[0.06]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editText.trim() || busyAction === "edit"}
                  className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[11px] font-medium text-blue-100 transition hover:bg-blue-500/15 disabled:opacity-50"
                >
                  {busyAction === "edit" ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="break-words whitespace-pre-wrap [overflow-wrap:anywhere] text-[14px] leading-[1.5]">
              {renderMessageText(message.messageText, currentUsername, {
                vivid: usesVividBubble,
              })}
            </div>
          )}

          {!groupedWithNext ? (
            <div
              className={`mt-1 text-[10px] font-medium ${timestampTextClass}`}
            >
              {formatTime(message.sentAt)}
              {editedLabel}
            </div>
          ) : null}
          </div>
        </div>

        {!isEditing ? (
          <ReactionBar
            reactions={message.reactions}
            busyAction={busyAction}
            isMine={isMine}
            onOpenPicker={() => {
              setPickerOpen((prev) => !prev);
              setMenuOpen(false);
            }}
            onToggleReaction={
              typeof onToggleReaction === "function"
                ? (emoji) => handleToggleReaction(emoji)
                : null
            }
          />
        ) : null}
      </div>
    </div>
  );
}
