import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";

function getStatusText(sessionStatus) {
  if (!sessionStatus) return "Live room";

  return (
    sessionStatus.statusText ||
    sessionStatus.label ||
    sessionStatus.status ||
    "Live room"
  );
}

function getStatusTone(sessionStatus, isLight) {
  const value = String(
    sessionStatus?.statusText || sessionStatus?.status || ""
  ).toLowerCase();

  if (
    value.includes("live") ||
    value.includes("active") ||
    value.includes("running")
  ) {
    return isLight
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : "border-emerald-400/18 bg-emerald-500/10 text-emerald-200";
  }

  if (value.includes("ended") || value.includes("closed")) {
    return isLight
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : "border-amber-400/18 bg-amber-500/10 text-amber-200";
  }

  if (value.includes("reconnect") || value.includes("connecting")) {
    return isLight
      ? "border-violet-300 bg-violet-50 text-violet-700"
      : "border-violet-400/18 bg-violet-500/10 text-violet-200";
  }

  return isLight
    ? "border-sky-300 bg-sky-50 text-sky-800"
    : "border-blue-400/18 bg-blue-500/10 text-blue-200";
}

function getRoomDescription(room) {
  if (room?.description?.trim()) return room.description.trim();

  if (room?.slug === "battle-trivia") {
    return "Fast-paced live trivia with weekly standings and featured competition energy.";
  }

  if (room?.slug === "word-scramble") {
    return "Race to solve the word before the round ends and climb the rankings.";
  }

  return "Jump into the featured room and get straight into the action.";
}

function getMetaItems(room) {
  const items = [];

  if (room?.roomType) {
    items.push(room.roomType === "trivia" ? "Trivia" : room.roomType);
  }

  if (room?.sessionStatus?.sessionType) {
    items.push(room.sessionStatus.sessionType);
  }

  if (typeof room?.memberCount === "number") {
    items.push(`${room.memberCount} members`);
  } else if (typeof room?.onlineCount === "number") {
    items.push(`${room.onlineCount} online`);
  } else if (typeof room?.participantCount === "number") {
    items.push(`${room.participantCount} players`);
  }

  return items.slice(0, 3);
}

export default function FeaturedTriviaCard({ room }) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  if (!room?.id) return null;

  const statusText = getStatusText(room.sessionStatus);
  const statusTone = getStatusTone(room.sessionStatus, isLight);
  const description = getRoomDescription(room);
  const metaItems = getMetaItems(room);
  const runModeLabel =
    room?.sessionStatus?.runMode === "scheduled"
      ? "Scheduled windows"
      : room?.sessionStatus?.runMode === "continuous"
        ? "Running now"
        : room?.sessionStatus?.sessionType || "Live competition";
  const cardClassName = isLight
    ? "group block rounded-[20px] border border-[#d8c3a0] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_28%),linear-gradient(180deg,#fffaf1,#f2e4d1)] p-3.5 shadow-[0_18px_36px_rgba(122,84,37,0.14)] transition hover:-translate-y-[1px] hover:border-[#c69a57] hover:shadow-[0_22px_42px_rgba(122,84,37,0.18)] sm:rounded-[24px] sm:p-4 lg:p-5"
    : "group block rounded-[20px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 shadow-[0_16px_34px_rgba(0,0,0,0.14)] transition hover:-translate-y-[1px] hover:border-white/15 hover:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] sm:rounded-[24px] sm:p-4 lg:p-5";
  const featuredBadgeClassName = isLight
    ? "rounded-full border border-sky-300 bg-white/80 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-sky-800"
    : "rounded-full border border-blue-400/18 bg-blue-500/10 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-blue-200";
  const titleClassName = isLight
    ? "text-[20px] font-semibold tracking-[-0.04em] text-stone-900 sm:text-[24px]"
    : "text-[20px] font-semibold tracking-[-0.04em] text-white sm:text-[24px]";
  const descriptionClassName = isLight
    ? "mt-1.5 max-w-[44rem] text-[13px] leading-6 text-stone-600 sm:text-[14px]"
    : "mt-1.5 max-w-[44rem] text-[13px] leading-6 text-neutral-400 sm:text-[14px]";
  const ctaClassName = isLight
    ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-sky-700 px-4 text-sm font-semibold text-white transition group-hover:bg-sky-800"
    : "inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-blue-500 px-4 text-sm font-semibold text-white transition group-hover:bg-blue-400";

  return (
    <Link to={`/rooms/${room.id}`} className={cardClassName}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className={featuredBadgeClassName}>Main competition</div>

            <div
              className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${statusTone}`}
            >
              {statusText}
            </div>
          </div>

          <div className="mt-3">
            <h3 className={titleClassName}>{room.name || "Featured room"}</h3>

            <p className={descriptionClassName}>{description}</p>
          </div>

          <div
            className={`mt-3 text-[10px] font-medium uppercase tracking-[0.12em] ${
              isLight ? "text-stone-500" : "text-neutral-500"
            }`}
          >
            {[runModeLabel, ...metaItems].filter(Boolean).join(" · ")}
          </div>
        </div>

        <div className={ctaClassName}>
          Enter room
          <span aria-hidden="true">&rarr;</span>
        </div>
      </div>
    </Link>
  );
}
