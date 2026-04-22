function formatSeconds(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  if (value < 10) return `${value.toFixed(2)}s`;
  return `${value.toFixed(1)}s`;
}

export default function WordScrambleProfileCard({
  stats,
  playerRank,
  loading = false,
}) {
  if (loading && !stats) {
    return (
      <div className="rounded-[22px] border border-white/10 bg-neutral-950/80 p-3.5">
        <div className="text-[11px] font-medium text-neutral-400">
          Loading Word Scramble stats...
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
            Word Scramble
          </div>
        </div>

        {playerRank ? (
          <span className="shrink-0 rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-violet-200">
            #{playerRank}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Solved
          </div>
          <div className="mt-1 text-base font-semibold text-blue-300">
            {stats?.correctAnswers ?? 0}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Streak
          </div>
          <div className="mt-1 text-base font-semibold text-violet-200">
            x{stats?.currentStreak ?? 0}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Best
          </div>
          <div className="mt-1 text-base font-semibold text-white">
            x{stats?.bestStreak ?? 0}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Fastest
          </div>
          <div className="mt-1 text-[13px] font-semibold text-emerald-200">
            {formatSeconds(stats?.fastestSolveSeconds)}
          </div>
        </div>
      </div>
    </div>
  );
}
