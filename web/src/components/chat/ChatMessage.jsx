import { useEffect, useRef, useState } from "react";

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

export default function ChatMessage({
  message,
  currentUserId,
  previousMessage,
  nextMessage,
  isAdmin = false,
  onDeleteMessage,
  onMuteUser,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const menuRef = useRef(null);

  const isSystem = message.messageType === "system";
  const isMine = message.userId === currentUserId;
  const isMessageFromModerator = message.isAdmin === true;

  const groupedWithPrevious = isSameSender(message, previousMessage);
  const groupedWithNext = isSameSender(message, nextMessage);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

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

  const bubbleBase =
    "inline-flex min-w-[9rem] max-w-[88%] sm:max-w-[80%] lg:max-w-[44rem] flex-col px-3.5 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.14)] transition-all duration-200";

  const mineStyles = isMessageFromModerator
    ? "bg-[linear-gradient(180deg,rgba(88,101,242,1)_0%,rgba(64,78,237,1)_100%)] text-white ring-1 ring-violet-300/25"
    : "bg-[linear-gradient(180deg,rgba(55,149,255,1)_0%,rgba(10,132,255,1)_100%)] text-white";

  const theirsStyles = isMessageFromModerator
    ? "border border-violet-400/15 bg-[linear-gradient(180deg,rgba(58,49,94,0.92)_0%,rgba(41,35,68,0.96)_100%)] text-violet-50"
    : "border border-white/[0.05] bg-[linear-gradient(180deg,rgba(46,46,49,0.98),rgba(34,34,37,0.98))] text-neutral-100";

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

  return (
    <div
      className={`${groupedWithPrevious ? "mt-1" : "mt-3.5 sm:mt-4"} flex ${
        isMine ? "justify-end" : "justify-start"
      }`}
    >
      <div className="relative max-w-full" ref={menuRef}>
        {canModerateMessage ? (
          <div
            className={`absolute -top-2 z-10 ${
              isMine ? "-left-2" : "-right-2"
            }`}
          >
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-full border border-white/10 bg-black/55 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-neutral-400 backdrop-blur-sm transition hover:bg-black/75 hover:text-neutral-200"
            >
              •••
            </button>

            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-white/10 bg-neutral-900 p-1.5 shadow-xl shadow-black/30">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!!busyAction}
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
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          className={`${bubbleBase} ${roundedClass} ${
            isMine ? mineStyles : theirsStyles
          }`}
        >
          {!groupedWithPrevious ? (
            <div className="mb-1.5 flex items-center gap-2">
              {!isMine ? (
                <div
                  className={`text-[10px] font-medium tracking-[0.01em] ${
                    isMessageFromModerator
                      ? "text-violet-200/85"
                      : "text-neutral-400"
                  }`}
                >
                  {message.displayName || message.username || "Unknown"}
                </div>
              ) : null}

              {isMessageFromModerator ? (
                <span className="rounded-full border border-violet-300/20 bg-violet-300/12 px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-100">
                  Mod
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="break-words whitespace-pre-wrap text-[14px] leading-[1.5]">
            {message.messageText}
          </div>

          {!groupedWithNext ? (
            <div
              className={`mt-1.5 text-[10px] ${
                isMessageFromModerator
                  ? isMine
                    ? "text-violet-100/75"
                    : "text-violet-200/50"
                  : isMine
                  ? "text-white/68"
                  : "text-neutral-500"
              }`}
            >
              {formatTime(message.sentAt)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}