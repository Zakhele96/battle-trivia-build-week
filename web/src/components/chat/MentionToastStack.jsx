import { useEffect } from "react";

function MentionToast({ item, onDismiss }) {
  return (
    <button
      type="button"
      onClick={() => onDismiss(item.id)}
      className="pointer-events-auto w-full rounded-[18px] border border-amber-400/18 bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(245,158,11,0.08))] px-4 py-3 text-left shadow-[0_16px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:bg-[linear-gradient(180deg,rgba(245,158,11,0.2),rgba(245,158,11,0.1))]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-amber-100/80">
            You were mentioned
          </div>

          <div className="mt-1 truncate text-sm font-semibold text-white">
            {item.displayName || item.username || "Someone"}
          </div>

          <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-amber-50/85">
            {item.messageText}
          </div>
        </div>

        <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.08] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-white/90">
          Tap
        </div>
      </div>
    </button>
  );
}

export default function MentionToastStack({
  items,
  onDismiss,
  autoHideMs = 4500,
}) {
  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;

    const timers = items.map((item) =>
      window.setTimeout(() => {
        onDismiss(item.id);
      }, autoHideMs)
    );

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [items, onDismiss, autoHideMs]);

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[90] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2 sm:right-4 sm:top-4">
      {items.slice(-3).map((item) => (
        <MentionToast key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
}