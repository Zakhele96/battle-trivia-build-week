import { useEffect, useRef, useState } from "react";

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

export default function ChatInput({
  onSend,
  disabled,
  placeholder = "Type a message...",
  buttonLabel = "Send",
  busyLabel = "Sending...",
}) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);

  const trimmed = text.trim();
  const canSubmit = !!trimmed && !disabled && !isSending;

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const submit = async (e) => {
    e.preventDefault();

    if (!canSubmit) return;

    try {
      setIsSending(true);
      await onSend(trimmed);
      setText("");
      inputRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex items-end gap-2.5 sm:gap-3">
      <div className="group relative flex-1">
        <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_58%)]" />

        <div className="relative min-h-[56px] overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 focus-within:border-blue-400/20 focus-within:shadow-[0_12px_30px_rgba(0,0,0,0.22)] sm:min-h-[58px]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

          <div className="flex min-h-[56px] items-center gap-3 px-4 sm:min-h-[58px] sm:px-4.5">
            <span
              className={`hidden h-2 w-2 shrink-0 rounded-full sm:block ${
                canSubmit
                  ? "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.6)]"
                  : "bg-neutral-600"
              }`}
            />

            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              disabled={disabled || isSending}
              autoCapitalize="sentences"
              autoCorrect="on"
              spellCheck
              enterKeyHint="send"
              inputMode="text"
              className="h-full w-full bg-transparent text-[16px] text-white outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[15px]"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className={`group relative h-[56px] overflow-hidden rounded-[22px] transition-all duration-300 sm:h-[58px] ${
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
          className={`relative flex h-full items-center gap-2 px-3.5 sm:px-4 ${
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
  );
}