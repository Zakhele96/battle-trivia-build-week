import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";

function getRoomMeta(room, isLight) {
  if (room?.slug === "rapnometry-arena") {
    return {
      badge: "Battle arena",
      accent: isLight
        ? "text-amber-900 border-amber-300 bg-white/80"
        : "text-amber-200 border-amber-400/18 bg-amber-500/10",
      cta: "Enter arena",
    };
  }

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

  if (room?.slug === "rapnometry-arena") {
    return "Create open mic challenges, submit verses, and vote for the strongest bars in the room.";
  }

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

  if (room?.slug === "rapnometry-arena") {
    items.push("Arena");
  } else if (room?.roomType === "trivia") {
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

function getRoomVisual(room, isLight) {
  if (room?.slug === "rapnometry-arena") {
    return {
      glyph: "🎙",
      shellClassName: isLight
        ? "border-amber-300 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.28),transparent_64%),linear-gradient(180deg,#fff8ea,#f2ddb2)] text-amber-900"
        : "border-amber-400/24 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.24),transparent_60%),linear-gradient(180deg,rgba(84,57,13,0.96),rgba(16,12,8,0.98))] text-amber-200 shadow-[0_0_24px_rgba(251,191,36,0.14)]",
    };
  }

  if (room?.slug === "battle-trivia" || room?.roomType === "trivia") {
    return {
      glyph: "🧠",
      shellClassName: isLight
        ? "border-sky-300 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.28),transparent_64%),linear-gradient(180deg,#f6fbff,#dcecff)] text-sky-900"
        : "border-blue-400/24 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.28),transparent_60%),linear-gradient(180deg,rgba(14,34,74,0.96),rgba(8,12,20,0.98))] text-blue-200 shadow-[0_0_24px_rgba(59,130,246,0.16)]",
    };
  }

  if (room?.slug === "word-scramble" || room?.roomType === "game") {
    return {
      glyph: "🔤",
      shellClassName: isLight
        ? "border-violet-300 bg-[radial-gradient(circle_at_top,rgba(167,139,250,0.28),transparent_64%),linear-gradient(180deg,#fbf7ff,#eadfff)] text-violet-900"
        : "border-violet-400/24 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.28),transparent_60%),linear-gradient(180deg,rgba(51,22,86,0.96),rgba(10,8,18,0.98))] text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.16)]",
    };
  }

  return {
    glyph: "#",
    shellClassName: isLight
      ? "border-stone-200 bg-[linear-gradient(180deg,#ffffff,#f2ebe1)] text-stone-700"
      : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-neutral-200",
  };
}

export default function RoomCard({ room }) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const isLive = !!room?.isLiveNow;
  const meta = getRoomMeta(room, isLight);
  const description = getRoomDescription(room);
  const metaPills = getMetaPills(room, isLive);
  const statusLabel = isLive ? "Live now" : "Open";
  const visual = getRoomVisual(room, isLight);

  const cardClassName = isLight
    ? "group block rounded-[22px] border border-[#d8c3a0] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.08),transparent_26%),linear-gradient(180deg,#fffaf1,#f2e4d1)] p-4 shadow-[0_18px_36px_rgba(122,84,37,0.12)] transition hover:-translate-y-[1px] hover:border-[#c69a57] hover:shadow-[0_22px_42px_rgba(122,84,37,0.16)] sm:rounded-[24px] sm:p-4"
    : "group block rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.08),transparent_22%),linear-gradient(180deg,rgba(20,24,34,0.98),rgba(8,10,16,0.98))] p-4 shadow-[0_22px_46px_rgba(0,0,0,0.24)] transition hover:-translate-y-[1px] hover:border-white/16 hover:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.1),transparent_24%),linear-gradient(180deg,rgba(24,30,42,1),rgba(8,10,16,1))] sm:rounded-[24px] sm:p-4";
  const titleClassName = isLight
    ? "text-[19px] font-semibold tracking-[-0.04em] text-stone-900 sm:text-[20px]"
    : "text-[19px] font-semibold tracking-[-0.04em] text-white sm:text-[20px]";
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
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
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

          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-[24px] ${visual.shellClassName}`}
          >
            <span aria-hidden="true">{visual.glyph}</span>
          </div>
        </div>

        <div className="mt-3 min-w-0">
          <h3 className={`${titleClassName} line-clamp-2`}>{room?.name || "Room"}</h3>
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

        <div className="mt-4 sm:hidden">
          <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-black/20 px-3.5 py-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                Ready to join
              </div>
              <div className="mt-1 truncate text-[13px] font-medium text-white">
                {meta.cta}
              </div>
            </div>

            <div className="inline-flex h-10 items-center rounded-[14px] border border-blue-400/18 bg-blue-500/10 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100">
              Open
            </div>
          </div>
        </div>

        <div className={`mt-4 hidden sm:inline-flex ${ctaClassName}`}>
          {meta.cta}
          <span aria-hidden="true">&rarr;</span>
        </div>
      </div>
    </Link>
  );
}
