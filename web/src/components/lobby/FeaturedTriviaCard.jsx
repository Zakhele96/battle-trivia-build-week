import { Link } from "react-router-dom";

function getStatusText(sessionStatus) {
  if (!sessionStatus) return "Live room";

  return (
    sessionStatus.statusText ||
    sessionStatus.label ||
    sessionStatus.status ||
    "Live room"
  );
}

function getStatusTone(sessionStatus) {
  const value = String(
    sessionStatus?.statusText || sessionStatus?.status || ""
  ).toLowerCase();

  if (
    value.includes("live") ||
    value.includes("active") ||
    value.includes("running")
  ) {
    return "border-emerald-400/18 bg-emerald-500/10 text-emerald-200";
  }

  if (value.includes("ended") || value.includes("closed")) {
    return "border-amber-400/18 bg-amber-500/10 text-amber-200";
  }

  if (value.includes("reconnect") || value.includes("connecting")) {
    return "border-violet-400/18 bg-violet-500/10 text-violet-200";
  }

  return "border-blue-400/18 bg-blue-500/10 text-blue-200";
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
  if (!room?.id) return null;

  const statusText = getStatusText(room.sessionStatus);
  const statusTone = getStatusTone(room.sessionStatus);
  const description = getRoomDescription(room);
  const metaItems = getMetaItems(room);

  return (
    <div className="rounded-[20px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 shadow-[0_16px_34px_rgba(0,0,0,0.14)] sm:rounded-[24px] sm:p-4 lg:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-blue-400/18 bg-blue-500/10 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-blue-200">
              Featured
            </div>

            <div
              className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${statusTone}`}
            >
              {statusText}
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-[20px] font-semibold tracking-[-0.04em] text-white sm:text-[24px]">
              {room.name || "Featured room"}
            </h3>

            <p className="mt-1.5 max-w-[44rem] text-[13px] leading-6 text-neutral-400 sm:text-[14px]">
              {description}
            </p>
          </div>

          {metaItems.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {metaItems.map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-white/8 bg-black/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400"
                >
                  {item}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            to={`/rooms/${room.id}`}
            className="inline-flex items-center gap-2 rounded-[16px] bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)] transition hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(37,99,235,0.3)]"
          >
            Enter room
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}