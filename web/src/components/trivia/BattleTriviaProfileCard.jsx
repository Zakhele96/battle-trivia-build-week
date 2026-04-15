function formatFastest(ms) {
  if (typeof ms !== "number") return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 10000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function BattleTriviaProfileCard({
  stats,
  liveStreak,
  playerRank,
  loading = false,
  compact = true,
}) {
  const bestStreak = Math.max(stats?.bestStreak ?? 0, liveStreak?.best ?? 0);
  const currentStreak = liveStreak?.current ?? 0;
  const currentWeeklyRank = playerRank?.rank ?? stats?.currentWeeklyRank ?? null;
  const isWeeklyLeader = currentWeeklyRank === 1;

  if (loading) {
    return (
      <div className="rounded-[22px] border border-white/10 bg-neutral-950/80 p-3.5">
        <div className="text-[11px] font-medium text-neutral-400">
          Loading stats...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-white/10 bg-neutral-950/80 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">
            Your stats
          </h3>
          <div className="mt-0.5 text-[10px] text-neutral-500">
            Battle Trivia
          </div>
        </div>

        {isWeeklyLeader ? (
          <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-amber-200">
            👑 Leader
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Streak
          </div>
          <div className="mt-1 text-base font-semibold text-violet-200">
            x{currentStreak}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Best
          </div>
          <div className="mt-1 text-base font-semibold text-white">
            x{bestStreak}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Correct
          </div>
          <div className="mt-1 text-base font-semibold text-blue-300">
            {stats?.totalCorrectAnswers ?? 0}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Wins
          </div>
          <div className="mt-1 text-base font-semibold text-amber-200">
            {stats?.weeklyWins ?? 0}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Fastest
          </div>
          <div className="mt-1 text-[13px] font-semibold text-emerald-200">
            {formatFastest(stats?.fastestCorrectAnswerMs)}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Rank
          </div>
          <div className="mt-1 text-base font-semibold text-white">
            {currentWeeklyRank ? `#${currentWeeklyRank}` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}