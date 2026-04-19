import { Link } from "react-router-dom";

function getRoomMeta(room) {
  if (room?.slug === "battle-trivia" || room?.roomType === "trivia") {
    return {
      badge: "Featured game",
      accent: "text-blue-300 border-blue-400/18 bg-blue-500/10",
      cta: "Enter trivia",
    };
  }

  if (room?.slug === "word-scramble" || room?.roomType === "game") {
    return {
      badge: "Game room",
      accent: "text-violet-300 border-violet-400/18 bg-violet-500/10",
      cta: "Enter game",
    };
  }

  if (room?.roomType === "chat") {
    return {
      badge: "Community",
      accent: "text-emerald-300 border-emerald-400/18 bg-emerald-500/10",
      cta: "Enter room",
    };
  }

  return {
    badge: "Room",
    accent: "text-neutral-300 border-white/10 bg-white/[0.045]",
    cta: "Enter room",
  };
}

function getRoomDescription(room) {
  if (room?.description?.trim()) return room.description.trim();

  if (room?.slug === "battle-trivia") {
    return "Fast-paced live trivia with weekly standings and featured competition energy.";
  }

  if (room?.slug === "word-scramble") {
    return "Race to solve the word before the round ends and climb the rankings.";
  }

  if (room?.roomType === "chat") {
    return "Join the conversation and hang out with the community in real time.";
  }

  return "Jump in and start participating live.";
}

function getMetaPills(room, isLive) {
  const items = [];

  if (room?.roomType === "trivia") {
    items.push("Trivia");
  } else if (room?.roomType === "game") {
    items.push("Game");
  } else if (room?.roomType === "chat") {
    items.push("Chat");
  } else if (room?.roomType) {
    items.push(room.roomType);
  }

  items.push(isLive ? "Live now" : "Open");

  if (typeof room?.memberCount === "number") {
    items.push(`${room.memberCount} members`);
  } else if (typeof room?.onlineCount === "number") {
    items.push(`${room.onlineCount} online`);
  } else if (typeof room?.participantCount === "number") {
    items.push(`${room.participantCount} players`);
  }

  return items.slice(0, 3);
}

function formatMentionCount(count) {
  return `${count} mention${count === 1 ? "" : "s"}`;
}

export default function RoomCard({ room }) {
  const isLive = !!room?.isLiveNow;
  const unreadMentionCount = Math.max(0, Number(room?.unreadMentionCount) || 0);
  const hasUnreadMentions = unreadMentionCount > 0;

  const meta = getRoomMeta(room);
  const description = getRoomDescription(room);
  const metaPills = getMetaPills(room, isLive);

  return (
    <div
      className={`group h-full overflow-hidden rounded-[18px] border shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-[2px] sm:rounded-[22px] sm:shadow-[0_14px_32px_rgba(0,0,0,0.14)] ${
        hasUnreadMentions
          ? "border-amber-400/18 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.014))] hover:border-amber-300/28"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.012))] hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.038),rgba(255,255,255,0.018))]"
      }`}
    >
      <div className="pointer-events-none h-px bg-white/10" />

      <div className="flex h-full flex-col p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${meta.accent}`}
            >
              {meta.badge}
            </span>

            {hasUnreadMentions ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/18 bg-amber-500/10 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-amber-100">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.5)]" />
                {formatMentionCount(unreadMentionCount)}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[9px] uppercase tracking-[0.14em] text-neutral-500">
              {isLive ? "Live" : "Open"}
            </span>
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                isLive
                  ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]"
                  : "bg-neutral-600"
              }`}
            />
          </div>
        </div>

        <div className="mt-3 min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-[-0.03em] text-white sm:text-[17px]">
            {room?.name || "Room"}
          </h3>

          <p className="mt-1.5 text-[12px] leading-5 text-neutral-400 sm:text-[13px] sm:leading-6">
            {description}
          </p>
        </div>

        {metaPills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {metaPills.map((item) => (
              <div
                key={item}
                className="rounded-full border border-white/8 bg-black/20 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-neutral-400"
              >
                {item}
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          {hasUnreadMentions ? (
            <div className="text-[11px] font-medium text-amber-200">
              You were mentioned here
            </div>
          ) : (
            <div />
          )}

          <Link
            to={`/rooms/${room?.id}`}
            className={`inline-flex items-center gap-2 rounded-[16px] border px-3.5 py-2 text-[12px] font-medium text-white transition-all duration-300 sm:rounded-[18px] sm:px-4 sm:py-2.5 sm:text-sm ${
              hasUnreadMentions
                ? "border-amber-400/18 bg-amber-500/10 hover:bg-amber-500/14"
                : "border-white/10 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.07]"
            }`}
          >
            {hasUnreadMentions ? "Open mention" : meta.cta}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}