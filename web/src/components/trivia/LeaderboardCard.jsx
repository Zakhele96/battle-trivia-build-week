export default function LeaderboardCard({
  title = "Leaderboard",
  badgeText = "Top 5",
  leaderboard = [],
  currentUserId,
  compact = false,
  showUsername = true,
}) {
  const shellClass = compact
    ? "rounded-[20px] border border-white/10 bg-neutral-950/80 p-3"
    : "rounded-[28px] border border-white/10 bg-neutral-950/80 p-5";

  const headerMarginClass = compact ? "mb-2.5" : "mb-3";
  const listGapClass = compact ? "space-y-2" : "space-y-3";

  return (
    <div className={shellClass}>
      <div className={`${headerMarginClass} flex items-center justify-between`}>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {!compact ? (
            <div className="mt-0.5 text-[11px] text-neutral-500">
              Live room standings
            </div>
          ) : null}
        </div>

        <span
          className={`rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 ${
            compact ? "text-[10px]" : "text-[11px]"
          } font-medium uppercase tracking-[0.14em] text-neutral-400`}
        >
          {badgeText}
        </span>
      </div>

      {leaderboard.length === 0 ? (
        <div className="rounded-2xl border border-white/6 bg-white/[0.02] px-3 py-4 text-sm text-neutral-500">
          No scores yet.
        </div>
      ) : (
        <div className={listGapClass}>
          {leaderboard.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            const isTopThree = entry.rank <= 3;
            const isChampion = entry.rank === 1;

            const rowClass = isCurrentUser
              ? isChampion
                ? "border-amber-400/25 bg-amber-500/10 ring-1 ring-amber-400/15"
                : "border-blue-500/20 bg-blue-500/10 ring-1 ring-blue-500/20"
              : isChampion
              ? "border-amber-400/20 bg-amber-500/8 ring-1 ring-amber-400/10"
              : "border-white/6 bg-white/[0.03]";

            const stripeClass = isCurrentUser
              ? isChampion
                ? "bg-amber-300/85"
                : "bg-blue-400/80"
              : isChampion
              ? "bg-amber-300/75"
              : isTopThree
              ? "bg-violet-400/60"
              : "bg-white/5";

            const rankBadgeClass = isChampion
              ? "bg-amber-400/15 text-amber-200"
              : isCurrentUser
              ? "bg-blue-400/15 text-blue-200"
              : isTopThree
              ? "bg-violet-400/15 text-violet-200"
              : "bg-white/[0.05] text-neutral-400";

            return (
              <div
                key={entry.userId}
                className={`relative overflow-hidden rounded-2xl border px-3 py-2.5 transition-all duration-300 ${rowClass}`}
              >
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1">
                  <div className={`h-full w-full ${stripeClass}`} />
                </div>

                <div className="ml-1 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex min-w-[2rem] items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${rankBadgeClass}`}
                      >
                        #{entry.rank}
                      </span>

                      {isChampion ? (
                        <span className="shrink-0 text-[12px]" aria-hidden="true">
                          👑
                        </span>
                      ) : null}

                      <div className="truncate text-sm font-medium text-white">
                        {entry.displayName || entry.username}
                      </div>

                      {isChampion ? (
                        <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-amber-200">
                          Champion
                        </span>
                      ) : null}
                    </div>

                    {!compact && showUsername ? (
                      <div className="mt-1 truncate pl-[2.55rem] text-[11px] text-neutral-500">
                        @{entry.username}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                      Score
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        isChampion ? "text-amber-200" : "text-blue-300"
                      }`}
                    >
                      {entry.score}
                    </div>
                  </div>
                </div>

                {isCurrentUser ? (
                  <div
                    className={`mt-2 ml-1 text-[10px] uppercase tracking-[0.16em] ${
                      isChampion ? "text-amber-200/80" : "text-blue-200/75"
                    }`}
                  >
                    {isChampion ? "You · Weekly crown" : "You"}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}