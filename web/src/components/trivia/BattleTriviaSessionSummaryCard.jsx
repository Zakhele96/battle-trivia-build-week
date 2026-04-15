function formatFastest(ms) {
  if (typeof ms !== "number") return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 10000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatEndedAt(value) {
  if (!value) return "Latest weekly finish";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Latest weekly finish";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function BattleTriviaSessionSummaryCard({
  summary,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="rounded-[22px] border border-white/10 bg-neutral-950/80 p-3.5">
        <div className="text-[11px] font-medium text-neutral-400">
          Loading session summary...
        </div>
      </div>
    );
  }

  if (!summary?.hasSummary) {
    return (
      <div className="rounded-[22px] border border-white/10 bg-neutral-950/80 p-3.5">
        <div className="text-sm font-semibold text-white">Last weekly finish</div>
        <div className="mt-1 text-[11px] text-neutral-500">
          Your latest Battle Trivia summary will appear here after a weekly session ends.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-white/10 bg-neutral-950/80 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">
            Last weekly finish
          </h3>
          <div className="mt-0.5 text-[10px] text-neutral-500">
            {formatEndedAt(summary.endedAt)}
          </div>
        </div>

        {summary.isChampion ? (
          <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-amber-200">
            👑 Champion
          </span>
        ) : summary.isTopThree ? (
          <span className="shrink-0 rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-violet-200">
            Top 3
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Final rank
          </div>
          <div className="mt-1 text-base font-semibold text-white">
            {summary.finalRank ? `#${summary.finalRank}` : "—"}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Score
          </div>
          <div className="mt-1 text-base font-semibold text-blue-300">
            {summary.totalScore}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Correct
          </div>
          <div className="mt-1 text-base font-semibold text-emerald-200">
            {summary.totalCorrectAnswers}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Best streak
          </div>
          <div className="mt-1 text-base font-semibold text-violet-200">
            x{summary.bestStreak}
          </div>
        </div>

        <div className="col-span-2 rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Fastest correct
          </div>
          <div className="mt-1 text-[13px] font-semibold text-amber-200">
            {formatFastest(summary.fastestCorrectAnswerMs)}
          </div>
        </div>
      </div>
    </div>
  );
}