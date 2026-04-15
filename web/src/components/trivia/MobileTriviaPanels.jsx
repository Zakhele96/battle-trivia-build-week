import LeaderboardCard from "./LeaderboardCard";
import PlayerStandingCard from "./PlayerStandingCard";

export default function MobileTriviaPanels({
  showMobileStanding,
  setShowMobileStanding,
  showMobileLeaderboard,
  setShowMobileLeaderboard,
  playerRank,
  attemptsInfo,
  mobileLeaderboard,
  currentUserId,
}) {
  return (
    <div className="mt-3 space-y-3 xl:hidden">
      <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_35%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(18,22,30,0.96)_55%,rgba(10,10,11,1)_100%)] shadow-xl shadow-black/20">
        <div className="pointer-events-none h-px bg-white/10" />

        <div className="p-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowMobileStanding((prev) => !prev)}
              className={`group relative overflow-hidden rounded-[18px] border px-3.5 py-3 text-left transition-all duration-300 ${
                showMobileStanding
                  ? "border-blue-400/20 bg-blue-500/10 ring-1 ring-blue-400/15"
                  : "border-white/8 bg-white/[0.03] active:bg-white/[0.06]"
              }`}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_45%,transparent_100%)]" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        showMobileStanding
                          ? "bg-blue-300 shadow-[0_0_12px_rgba(147,197,253,0.75)]"
                          : "bg-neutral-500"
                      }`}
                    />
                    <span className="text-sm font-semibold text-white">
                      Standing
                    </span>
                  </div>

                  <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Personal stats
                  </div>

                  <div className="mt-2 text-[11px] text-neutral-400">
                    {showMobileStanding ? "Visible now" : "Tap to show"}
                  </div>
                </div>

                <div
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
                    showMobileStanding
                      ? "bg-blue-400/15 text-blue-200"
                      : "bg-white/[0.05] text-neutral-500"
                  }`}
                >
                  {showMobileStanding ? "On" : "Off"}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowMobileLeaderboard((prev) => !prev)}
              className={`group relative overflow-hidden rounded-[18px] border px-3.5 py-3 text-left transition-all duration-300 ${
                showMobileLeaderboard
                  ? "border-violet-400/20 bg-violet-500/10 ring-1 ring-violet-400/15"
                  : "border-white/8 bg-white/[0.03] active:bg-white/[0.06]"
              }`}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_45%,transparent_100%)]" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        showMobileLeaderboard
                          ? "bg-violet-300 shadow-[0_0_12px_rgba(196,181,253,0.75)]"
                          : "bg-neutral-500"
                      }`}
                    />
                    <span className="text-sm font-semibold text-white">
                      Top 3
                    </span>
                  </div>

                  <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Live ranking
                  </div>

                  <div className="mt-2 text-[11px] text-neutral-400">
                    {showMobileLeaderboard ? "Visible now" : "Tap to show"}
                  </div>
                </div>

                <div
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
                    showMobileLeaderboard
                      ? "bg-violet-400/15 text-violet-200"
                      : "bg-white/[0.05] text-neutral-500"
                  }`}
                >
                  {showMobileLeaderboard ? "On" : "Off"}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {showMobileStanding ? (
          <PlayerStandingCard
            playerRank={playerRank}
            attemptsInfo={attemptsInfo}
            compact
            showAttempts
          />
        ) : null}

        {showMobileLeaderboard ? (
          <LeaderboardCard
            title="Leaderboard"
            badgeText="Top 3"
            leaderboard={mobileLeaderboard}
            currentUserId={currentUserId}
            compact
            showUsername={false}
          />
        ) : null}
      </div>
    </div>
  );
}