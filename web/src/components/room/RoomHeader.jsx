export default function RoomHeader({
  roomName,
  status,
  sessionLabel,
  userDisplayName,
  isBattleTrivia,
}) {
  const statusMeta =
    status === "connected"
      ? {
          label: "Live",
          dotClass:
            "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]",
          pillClass:
            "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
        }
      : status === "reconnecting"
      ? {
          label: "Reconnecting",
          dotClass:
            "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]",
          pillClass:
            "border-amber-400/20 bg-amber-500/10 text-amber-300",
        }
      : {
          label: "Connecting",
          dotClass: "bg-neutral-500",
          pillClass: "border-white/10 bg-white/[0.04] text-neutral-300",
        };

  return (
    <div className="border-b border-white/5 bg-black/10 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[68rem] flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-4 lg:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-white sm:text-[15px]">
              {roomName || "Room"}
            </span>

            <span
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${statusMeta.pillClass}`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${statusMeta.dotClass}`}
              />
              {statusMeta.label}
            </span>

            {isBattleTrivia && sessionLabel ? (
              <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-300">
                {sessionLabel}
              </span>
            ) : null}
          </div>

          <div className="mt-1 text-[11px] text-neutral-500">
            Signed in as {userDisplayName || "Player"}
          </div>
        </div>
      </div>
    </div>
  );
}