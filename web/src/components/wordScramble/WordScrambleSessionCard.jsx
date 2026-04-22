function getPhaseLabel(phase) {
  if (phase === "active") return "Live now";
  if (phase === "reveal") return "Reveal";
  return "Waiting";
}

function getPhaseAccentClass(phase) {
  if (phase === "active") {
    return "border-emerald-400/18 bg-emerald-500/10 text-emerald-300";
  }

  if (phase === "reveal") {
    return "border-amber-400/18 bg-amber-500/10 text-amber-300";
  }

  return "border-white/10 bg-white/[0.04] text-neutral-300";
}

export default function WordScrambleSessionCard({
  state,
  currentUserId,
  loading = false,
}) {
  const leaderboard = Array.isArray(state?.leaderboard) ? state.leaderboard : [];
  const winners = Array.isArray(state?.winners) ? state.winners : [];
  const leader = leaderboard[0] || null;
  const myRow = leaderboard.find((entry) => entry.userId === currentUserId) || null;

  if (loading && !state) {
    return (
      <div className="rounded-[22px] border border-white/10 bg-neutral-950/80 p-3.5">
        <div className="text-[11px] font-medium text-neutral-400">
          Loading Word Scramble round...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-white/10 bg-neutral-950/80 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">
            Round pulse
          </h3>
          <div className="mt-0.5 text-[10px] text-neutral-500">
            {state?.roundNumber ? `Round ${state.roundNumber}` : "Waiting for next round"}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] ${getPhaseAccentClass(
            state?.phase
          )}`}
        >
          {getPhaseLabel(state?.phase)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Category
          </div>
          <div className="mt-1 truncate text-[13px] font-semibold text-white">
            {state?.category || "Word Scramble"}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Leader
          </div>
          <div className="mt-1 truncate text-[13px] font-semibold text-white">
            {leader?.displayName || leader?.username || "-"}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Your place
          </div>
          <div className="mt-1 text-base font-semibold text-violet-200">
            {myRow?.rank ? `#${myRow.rank}` : "-"}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Top score
          </div>
          <div className="mt-1 text-base font-semibold text-blue-300">
            {leader?.score ?? 0}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-2 col-span-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            Solvers
          </div>
          <div className="mt-1 text-base font-semibold text-emerald-200">
            {winners.length}
          </div>
        </div>
      </div>
    </div>
  );
}
