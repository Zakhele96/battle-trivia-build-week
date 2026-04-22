import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";

function formatTimestamp(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MentionInboxCard({
  title = "Unread mentions",
  description = "Jump straight to the exact messages that mentioned you.",
  items = [],
}) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  if (!Array.isArray(items) || items.length === 0) return null;

  const cardClassName = isLight
    ? "mb-5 rounded-[20px] border border-[#d9bf92] bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_36%),linear-gradient(180deg,#fff8ee,#f4e2c4)] p-4 shadow-[0_16px_32px_rgba(138,96,34,0.14)] sm:mb-6 sm:rounded-[22px]"
    : "mb-5 rounded-[20px] border border-amber-400/18 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_36%),linear-gradient(180deg,rgba(245,158,11,0.08),rgba(245,158,11,0.04))] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.12)] sm:mb-6 sm:rounded-[22px]";
  const eyebrowClassName = isLight
    ? "text-[10px] uppercase tracking-[0.18em] text-amber-700/80 sm:text-[11px]"
    : "text-[10px] uppercase tracking-[0.18em] text-amber-200/80 sm:text-[11px]";
  const titleClassName = isLight
    ? "mt-1 text-[15px] font-semibold text-stone-900 sm:text-[17px]"
    : "mt-1 text-[15px] font-semibold text-white sm:text-[17px]";
  const descriptionClassName = isLight
    ? "mt-1.5 text-[12px] leading-5 text-stone-600 sm:text-[13px]"
    : "mt-1.5 text-[12px] leading-5 text-amber-50/80 sm:text-[13px]";
  const badgeClassName = isLight
    ? "rounded-full border border-stone-200 bg-white/76 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-stone-700"
    : "rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/80";
  const itemClassName = isLight
    ? "block rounded-[16px] border border-stone-200 bg-white/78 px-3.5 py-3 transition hover:border-amber-300 hover:bg-white"
    : "block rounded-[16px] border border-white/10 bg-black/20 px-3.5 py-3 transition hover:border-white/15 hover:bg-black/30";
  const roomClassName = isLight
    ? "text-[10px] uppercase tracking-[0.16em] text-stone-500"
    : "text-[10px] uppercase tracking-[0.16em] text-neutral-500";
  const sourceClassName = isLight
    ? "mt-1 text-[13px] font-semibold text-stone-900 sm:text-sm"
    : "mt-1 text-[13px] font-semibold text-white sm:text-sm";
  const sourceHandleClassName = isLight
    ? "ml-2 text-[11px] font-normal text-stone-500"
    : "ml-2 text-[11px] font-normal text-neutral-500";
  const previewClassName = isLight
    ? "mt-1.5 text-[12px] leading-5 text-stone-700 sm:text-[13px]"
    : "mt-1.5 text-[12px] leading-5 text-neutral-300 sm:text-[13px]";
  const timestampClassName = isLight
    ? "shrink-0 text-[10px] text-stone-500"
    : "shrink-0 text-[10px] text-neutral-500";
  const ctaClassName = isLight
    ? "mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-800"
    : "mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300/18 bg-amber-300/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-100";

  return (
    <div className={cardClassName}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className={eyebrowClassName}>Mention inbox</div>
          <div className={titleClassName}>{title}</div>
          <div className={descriptionClassName}>{description}</div>
        </div>

        <div className={badgeClassName}>{items.length} unread</div>
      </div>

      <div className="mt-4 space-y-2.5">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/rooms/${item.roomId}`}
            state={{ targetMessageId: item.chatMessageId }}
            className={itemClassName}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={roomClassName}>{item.roomName}</div>

                <div className={sourceClassName}>
                  {item.sourceDisplayName || item.sourceUsername || "Someone"}
                  {item.sourceUsername ? (
                    <span className={sourceHandleClassName}>
                      @{item.sourceUsername}
                    </span>
                  ) : null}
                </div>

                <div className={previewClassName}>
                  {item.previewText || "You were mentioned in a message."}
                </div>
              </div>

              <div className={timestampClassName}>
                {formatTimestamp(item.createdAt)}
              </div>
            </div>

            <div className={ctaClassName}>
              Open mention
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
