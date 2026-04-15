import { Link } from "react-router-dom";
import LeaderboardCard from "./LeaderboardCard";
import PlayerStandingCard from "./PlayerStandingCard";

export default function DesktopTriviaSidebar({
  room,
  status,
  sessionStatus,
  sessionLabel,
  isBattleTrivia,
  leaderboard,
  playerRank,
  currentUserId,
}) {
  return (
    <div className="space-y-3 p-3">
      <Link
        to="/"
        className="inline-flex text-sm text-blue-400 transition-colors hover:text-blue-300"
      >
        ← Back to lobby
      </Link>

      <div className="rounded-[24px] border border-white/10 bg-neutral-950/80 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-white">
              {room?.name || "Room"}
            </h2>

            <p
              className="mt-1.5 text-sm leading-5 text-neutral-400"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {room?.description || "Loading room..."}
            </p>
          </div>

          <span
            className={`mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
              status === "connected"
                ? "bg-emerald-400"
                : status === "reconnecting"
                ? "bg-amber-400"
                : "bg-neutral-500"
            }`}
          />
        </div>

        {isBattleTrivia ? (
          <div className="mt-3 space-y-2.5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-300">
                {sessionStatus?.runMode === "scheduled"
                  ? "Scheduled"
                  : "Continuous"}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
                  sessionStatus?.isLiveNow
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-amber-500/15 text-amber-300"
                }`}
              >
                {sessionStatus?.isLiveNow ? "Live now" : "Standby"}
              </span>
            </div>

            <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Session
              </div>
              <div className="mt-1 text-sm font-medium text-neutral-200">
                {sessionLabel}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {isBattleTrivia ? (
        <div className="space-y-3">
          <LeaderboardCard
            title="Leaderboard"
            badgeText="Top 5"
            leaderboard={leaderboard}
            currentUserId={currentUserId}
            compact
          />

          <PlayerStandingCard
            playerRank={playerRank}
            attemptsInfo={null}
            compact
            showAttempts={false}
          />
        </div>
      ) : null}
    </div>
  );
}