function getProgressPercent(xpTotal, currentLevelStartXp, nextLevelXp) {
  const span = Math.max(1, nextLevelXp - currentLevelStartXp);
  const earned = Math.max(0, xpTotal - currentLevelStartXp);
  return Math.min(100, Math.round((earned / span) * 100));
}

export default function ProfileProgressCard({ progression, loading = false }) {
  if (loading) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
        <div className="text-sm text-neutral-500">Loading progression...</div>
      </div>
    );
  }

  if (!progression) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
        <div className="text-sm text-neutral-500">No progression yet.</div>
      </div>
    );
  }

  const percent = getProgressPercent(
    progression.xpTotal,
    progression.currentLevelStartXp,
    progression.nextLevelXp
  );

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Progression</div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Level {progression.level}
          </div>
        </div>

        <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-200">
          {progression.xpTotal} XP
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between text-[11px] text-neutral-400">
        <span>{progression.currentLevelStartXp} XP</span>
        <span>{progression.nextLevelXp} XP</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(59,130,246,1)_0%,rgba(139,92,246,1)_100%)] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
        <span>{progression.achievementsCount} badge{progression.achievementsCount === 1 ? "" : "s"} earned</span>
        <span>{percent}% to next level</span>
      </div>
    </div>
  );
}