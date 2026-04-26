function getStatusDotClass(status) {
  if (status === "connected") {
    return "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]";
  }

  if (status === "reconnecting") {
    return "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.35)]";
  }

  return "bg-neutral-500";
}

function getStatusLabel(status) {
  if (status === "connected") return "Connected";
  if (status === "reconnecting") return "Reconnecting";
  if (status === "connecting") return "Connecting";
  return "Standby";
}

function getRoomDescription(room) {
  if (room?.description?.trim()) return room.description.trim();

  if (room?.slug === "battle-trivia" || room?.roomType === "trivia") {
    return "Fast-paced live trivia with weekly standings.";
  }

  if (room?.slug === "word-scramble") {
    return "Solve the word fast and climb the rankings.";
  }

  return "Live room";
}

export default function DesktopTriviaSidebar({
  room,
  status,
  sessionStatus,
  sessionLabel,
  sponsor = null,
  compact = false,
}) {
  const isLiveNow = !!sessionStatus?.isLiveNow;
  const runModeLabel =
    sessionStatus?.runMode === "scheduled" ? "Scheduled" : "Continuous";
  const description = getRoomDescription(room);

  return (
    <div className={`space-y-2.5 ${compact ? "p-2.5" : "p-3"}`}>
      <div className="rounded-[18px] border border-white/10 bg-neutral-950/70 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Room
            </div>

            <h2 className="mt-1 truncate text-[15px] font-semibold tracking-[-0.03em] text-white">
              {room?.name || "Room"}
            </h2>

            <p
              className="mt-1.5 text-[12px] leading-5 text-neutral-400"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {description}
            </p>
          </div>

          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.14em] text-neutral-500">
              {getStatusLabel(status)}
            </span>
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${getStatusDotClass(
                status
              )}`}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-neutral-300">
            {runModeLabel}
          </span>

          <span
            className={`rounded-full px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${
              isLiveNow
                ? "border border-emerald-400/18 bg-emerald-500/10 text-emerald-300"
                : "border border-amber-400/18 bg-amber-500/10 text-amber-300"
            }`}
          >
            {isLiveNow ? "Live now" : "Standby"}
          </span>

          {sessionLabel ? (
            <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-neutral-300">
              {sessionLabel}
            </span>
          ) : null}
        </div>

        {sponsor?.name ? (
          <div className="mt-3 rounded-[16px] border border-amber-300/18 bg-amber-500/10 p-3">
            <div className="text-[9px] uppercase tracking-[0.14em] text-amber-200/80">
              Sponsored this week
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              {sponsor.name}
            </div>
            <div className="mt-1 text-[11px] leading-5 text-neutral-300">
              {sponsor.sponsorText || "This week's competition is sponsored by"}
            </div>
            {sponsor.websiteUrl ? (
              <a
                href={sponsor.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100"
              >
                {sponsor.callToActionLabel || "Visit sponsor"}
                <span aria-hidden="true">→</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
