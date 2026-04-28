import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";

function getRoomMeta(room, isLight) {
  if (room?.slug === "battle-trivia" || room?.roomType === "trivia") {
    return {
      badge: "Featured game",
      accent: isLight
        ? "text-sky-800 border-sky-300 bg-white/80"
        : "text-blue-200 border-blue-400/18 bg-blue-500/10",
      cta: "Enter trivia",
    };
  }

  if (room?.slug === "word-scramble" || room?.roomType === "game") {
    return {
      badge: "Game room",
      accent: isLight
        ? "text-violet-700 border-violet-300 bg-white/80"
        : "text-violet-200 border-violet-400/18 bg-violet-500/10",
      cta: "Enter game",
    };
  }

  if (room?.roomType === "chat") {
    return {
      badge: "Community",
      accent: isLight
        ? "text-emerald-800 border-emerald-300 bg-white/80"
        : "text-emerald-200 border-emerald-400/18 bg-emerald-500/10",
      cta: "Enter room",
    };
  }

  return {
    badge: "Room",
    accent: isLight
      ? "text-stone-700 border-stone-200 bg-white/80"
      : "text-neutral-200 border-white/10 bg-white/[0.045]",
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

export default function RoomCard({ room }) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const isLive = !!room?.isLiveNow;
  const meta = getRoomMeta(room, isLight);
  const description = getRoomDescription(room);
  const metaPills = getMetaPills(room, isLive);
  const statusLabel = isLive ? "Live now" : "Open";

  const cardClassName = isLight
    ? "group block rounded-[20px] border border-[#d8c3a0] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.08),transparent_26%),linear-gradient(180deg,#fffaf1,#f2e4d1)] p-3.5 shadow-[0_18px_36px_rgba(122,84,37,0.12)] transition hover:-translate-y-[1px] hover:border-[#c69a57] hover:shadow-[0_22px_42px_rgba(122,84,37,0.16)] sm:rounded-[24px] sm:p-4"
    : "group block rounded-[20px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.1),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 shadow-[0_16px_34px_rgba(0,0,0,0.14)] transition hover:-translate-y-[1px] hover:border-white/15 hover:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] sm:rounded-[24px] sm:p-4";
  const titleClassName = isLight
    ? "text-[18px] font-semibold tracking-[-0.04em] text-stone-900 sm:text-[20px]"
    : "text-[18px] font-semibold tracking-[-0.04em] text-white sm:text-[20px]";
  const descriptionClassName = isLight
    ? "mt-1.5 text-[12px] leading-5 text-stone-600 sm:text-[13px] sm:leading-6"
    : "mt-1.5 text-[12px] leading-5 text-neutral-400 sm:text-[13px] sm:leading-6";
  const metaClassName = isLight
    ? "rounded-full border border-stone-200 bg-white/72 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-600"
    : "rounded-full border border-white/8 bg-black/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400";
  const liveToneClassName = isLive
    ? isLight
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : "border-emerald-400/18 bg-emerald-500/10 text-emerald-200"
    : isLight
      ? "border-stone-200 bg-white/76 text-stone-700"
      : "border-white/10 bg-white/[0.045] text-neutral-300";
  const ctaClassName = isLight
    ? "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f5fa8] transition group-hover:text-[#0b4f8e]"
    : "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200 transition group-hover:text-white";

  return (
    <Link to={`/rooms/${room?.id}`} className={`${cardClassName} h-full`}>
      <div className="flex h-full flex-col">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${meta.accent}`}
            >
              {meta.badge}
            </div>
            <div
              className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${liveToneClassName}`}
            >
              {statusLabel}
            </div>
          </div>

          <div className="mt-3 min-w-0">
            <h3 className={`${titleClassName} line-clamp-2`}>
              {room?.name || "Room"}
            </h3>
            <p className={`${descriptionClassName} line-clamp-3`}>{description}</p>
          </div>

          {metaPills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {metaPills.map((item) => (
                <div key={item} className={metaClassName}>
                  {item}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className={`mt-4 ${ctaClassName}`}>
          {meta.cta}
          <span aria-hidden="true">&rarr;</span>
        </div>
      </div>
    </Link>
  );
}
