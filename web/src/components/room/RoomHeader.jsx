import { Link } from "react-router-dom";

export default function RoomHeader({
  roomName,
  status,
  sessionLabel,
  userDisplayName,
  isBattleTrivia,
}) {
  const statusDotClass =
    status === "connected"
      ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
      : status === "reconnecting"
      ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
      : "bg-neutral-600";

  return (
    <div className="border-b border-white/5 bg-neutral-950/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[68rem] items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[17px] font-semibold tracking-[-0.03em] text-white sm:text-[19px]">
              {roomName || "Room"}
            </h1>

            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDotClass}`} />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
            <span>{userDisplayName || "Player"}</span>

            {isBattleTrivia ? (
              <>
                <span className="text-neutral-700">•</span>
                <span>{sessionLabel}</span>
              </>
            ) : null}
          </div>
        </div>

        <Link
          to="/profile"
          className="shrink-0 rounded-[16px] border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[11px] font-medium text-white transition hover:border-blue-400/20 hover:bg-white/[0.06]"
        >
          <span className="hidden sm:inline">Profile</span>
          <span className="sm:hidden">Me</span>
        </Link>
      </div>
    </div>
  );
}