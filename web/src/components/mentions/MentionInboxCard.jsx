import { Link } from "react-router-dom";

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
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="mb-5 rounded-[20px] border border-amber-400/18 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_36%),linear-gradient(180deg,rgba(245,158,11,0.08),rgba(245,158,11,0.04))] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.12)] sm:mb-6 sm:rounded-[22px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-amber-200/80 sm:text-[11px]">
            Mention inbox
          </div>
          <div className="mt-1 text-[15px] font-semibold text-white sm:text-[17px]">
            {title}
          </div>
          <div className="mt-1.5 text-[12px] leading-5 text-amber-50/80 sm:text-[13px]">
            {description}
          </div>
        </div>

        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/80">
          {items.length} unread
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/rooms/${item.roomId}`}
            state={{ targetMessageId: item.chatMessageId }}
            className="block rounded-[16px] border border-white/10 bg-black/20 px-3.5 py-3 transition hover:border-white/15 hover:bg-black/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  {item.roomName}
                </div>

                <div className="mt-1 text-[13px] font-semibold text-white sm:text-sm">
                  {item.sourceDisplayName || item.sourceUsername || "Someone"}
                  {item.sourceUsername ? (
                    <span className="ml-2 text-[11px] font-normal text-neutral-500">
                      @{item.sourceUsername}
                    </span>
                  ) : null}
                </div>

                <div className="mt-1.5 text-[12px] leading-5 text-neutral-300 sm:text-[13px]">
                  {item.previewText || "You were mentioned in a message."}
                </div>
              </div>

              <div className="shrink-0 text-[10px] text-neutral-500">
                {formatTimestamp(item.createdAt)}
              </div>
            </div>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300/18 bg-amber-300/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-100">
              Open mention
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}