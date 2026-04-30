import { useEffect, useMemo, useRef, useState } from "react";

function SendIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4.75 11.5L19.5 4.5L14.1 19.5L11.35 12.95L4.75 11.5Z"
        className="fill-current"
      />
    </svg>
  );
}

function ReplyBanner({ replyTarget, onCancelReply }) {
  if (!replyTarget) return null;

  return (
    <div className="mb-2 rounded-[16px] border border-blue-400/18 bg-blue-500/10 px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.14em] text-blue-200/80">
            Replying to
          </div>
          <div className="mt-1 truncate text-[12px] font-medium text-white">
            {replyTarget.displayName ||
              replyTarget.username ||
              "Unknown user"}
          </div>
          <div className="mt-1 truncate text-[12px] text-blue-100/80">
            {replyTarget.messageText}
          </div>
        </div>

        <button
          type="button"
          onClick={onCancelReply}
          className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.1]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function MentionMenu({
  suggestions,
  activeIndex,
  onSelect,
}) {
  if (!suggestions.length) return null;

  return (
    <div className="mb-2 overflow-hidden rounded-[18px] border border-white/10 bg-neutral-900/95 shadow-[0_16px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div className="border-b border-white/8 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
        Mention someone
      </div>

      <div className="max-h-56 overflow-y-auto p-2">
        <div className="space-y-1">
          {suggestions.map((user, index) => (
            <button
              key={user.id || user.username}
              type="button"
              onClick={() => onSelect(user)}
              className={`flex w-full items-center justify-between rounded-[14px] px-3 py-2 text-left transition ${
                index === activeIndex
                  ? "bg-blue-500/14"
                  : "hover:bg-white/[0.05]"
              }`}
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-white">
                  {user.displayName || user.username}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-neutral-500">
                  @{user.username}
                </div>
              </div>

              <div className="ml-3 shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                Mention
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function extractMentionMatch(value, caretIndex) {
  const safeCaret = typeof caretIndex === "number" ? caretIndex : value.length;
  const textBeforeCaret = value.slice(0, safeCaret);
  const match = textBeforeCaret.match(/(^|\s)(@[a-zA-Z0-9._-]*)$/);

  if (!match) return null;

  const mentionText = match[2] || "";
  const start = safeCaret - mentionText.length;
  const end = safeCaret;
  const query = mentionText.slice(1).toLowerCase();

  return {
    start,
    end,
    query,
  };
}

export default function ChatInput({
  onSend,
  disabled,
  placeholder = "Type a message...",
  buttonLabel = "Send",
  busyLabel = "Sending...",
  replyTarget = null,
  onCancelReply,
  mentionUsers = [],
}) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [caretIndex, setCaretIndex] = useState(0);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const inputRef = useRef(null);

  const trimmed = text.trim();
  const canSubmit = !!trimmed && !disabled && !isSending;

  const mentionMatch = useMemo(
    () => extractMentionMatch(text, caretIndex),
    [text, caretIndex]
  );

  const mentionSuggestions = useMemo(() => {
    if (!mentionMatch) return [];

    const query = mentionMatch.query.trim().toLowerCase();
    const safeUsers = Array.isArray(mentionUsers) ? mentionUsers : [];

    return safeUsers
      .filter((user) => user?.username)
      .filter((user, index, array) => {
        return (
          array.findIndex(
            (item) =>
              String(item?.username || "").toLowerCase() ===
              String(user?.username || "").toLowerCase()
          ) === index
        );
      })
      .filter((user) => {
        if (!query) return true;

        const username = String(user.username || "").toLowerCase();
        const displayName = String(user.displayName || "").toLowerCase();

        return username.includes(query) || displayName.includes(query);
      })
      .slice(0, 6);
  }, [mentionMatch, mentionUsers]);

  const isMentionMenuOpen = mentionSuggestions.length > 0;

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, replyTarget]);

  useEffect(() => {
    setActiveMentionIndex(0);
  }, [text, caretIndex]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.style.height = "0px";
    const nextHeight = Math.min(input.scrollHeight, 120);
    input.style.height = `${Math.max(nextHeight, 26)}px`;
  }, [text]);

  const updateCaret = (event) => {
    setCaretIndex(event.target.selectionStart ?? 0);
  };

  const applyMention = (user) => {
    if (!user?.username || !mentionMatch) return;

    const mentionText = `@${user.username} `;
    const nextValue =
      text.slice(0, mentionMatch.start) +
      mentionText +
      text.slice(mentionMatch.end);

    const nextCaret = mentionMatch.start + mentionText.length;

    setText(nextValue);
    setCaretIndex(nextCaret);
    setActiveMentionIndex(0);

    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const handleKeyDown = (event) => {
    if (isMentionMenuOpen) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveMentionIndex((prev) =>
          prev >= mentionSuggestions.length - 1 ? 0 : prev + 1
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveMentionIndex((prev) =>
          prev <= 0 ? mentionSuggestions.length - 1 : prev - 1
        );
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const selected = mentionSuggestions[activeMentionIndex];
        if (selected) {
          applyMention(selected);
        }
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setActiveMentionIndex(0);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) {
        submit(event);
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!canSubmit) return;

    try {
      setIsSending(true);

      const didSend = await onSend(trimmed, {
        replyToMessageId: replyTarget?.id ?? null,
      });

      if (!didSend) return;

      setText("");
      setCaretIndex(0);
      onCancelReply?.();
      inputRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <ReplyBanner
        replyTarget={replyTarget}
        onCancelReply={onCancelReply}
      />

      <MentionMenu
        suggestions={mentionSuggestions}
        activeIndex={activeMentionIndex}
        onSelect={applyMention}
      />

      <form
        onSubmit={submit}
        autoComplete="off"
        className="flex items-end gap-2 sm:gap-3"
      >
        <div className="group relative flex-1">
          <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_58%)]" />

          <div className="relative min-h-[52px] overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 focus-within:border-blue-400/20 focus-within:shadow-[0_12px_30px_rgba(0,0,0,0.22)] sm:min-h-[58px] sm:rounded-[24px]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

            <div className="flex min-h-[52px] items-center gap-2 px-3 sm:min-h-[58px] sm:gap-3 sm:px-4">
              <span
                className={`hidden h-2 w-2 shrink-0 rounded-full sm:block ${
                  canSubmit
                    ? "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.6)]"
                    : "bg-neutral-600"
                }`}
              />

              <textarea
                ref={inputRef}
                id="chat-message-input"
                name="chatMessage"
                rows={1}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setCaretIndex(e.target.selectionStart ?? e.target.value.length);
                }}
                onClick={updateCaret}
                onKeyUp={updateCaret}
                onSelect={updateCaret}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || isSending}
                autoComplete="off"
                autoCapitalize="sentences"
                autoCorrect="on"
                spellCheck
                autoSave="off"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                enterKeyHint="send"
                inputMode="text"
                className="max-h-[120px] min-h-[26px] w-full resize-none overflow-y-auto bg-transparent py-0.5 text-[15px] leading-5 text-white outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[15px] sm:leading-6"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`group relative h-[52px] overflow-hidden rounded-[18px] transition-all duration-300 sm:h-[58px] sm:rounded-[22px] ${
            canSubmit
              ? "shadow-[0_12px_28px_rgba(37,99,235,0.28)] hover:-translate-y-[1px] hover:shadow-[0_15px_34px_rgba(37,99,235,0.34)] active:translate-y-0"
              : "shadow-none"
          }`}
        >
          <span
            className={`absolute inset-0 transition-all duration-300 ${
              canSubmit
                ? "bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)]"
                : "bg-white/[0.05]"
            }`}
          />
          <span
            className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
              canSubmit
                ? "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_42%)] opacity-100"
                : "opacity-0"
            }`}
          />
          <span
            className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
              canSubmit ? "bg-white/30" : "bg-white/10"
            }`}
          />

          <span
            className={`relative flex h-full items-center gap-2 px-3 sm:px-4 ${
              canSubmit ? "text-white" : "text-neutral-500"
            }`}
          >
            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                canSubmit
                  ? "bg-white/16 shadow-inner shadow-white/10"
                  : "bg-white/[0.06]"
              }`}
            >
              <SendIcon
                className={`h-4 w-4 transition-all duration-300 ${
                  canSubmit ? "translate-x-[0.5px]" : ""
                }`}
              />
            </span>

            <span className="hidden min-w-[62px] text-left text-[13px] font-semibold tracking-[0.01em] sm:block">
              {isSending ? busyLabel : buttonLabel}
            </span>
          </span>
        </button>
      </form>
    </div>
  );
}
