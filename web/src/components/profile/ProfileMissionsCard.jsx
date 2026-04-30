function MissionProgress({ mission }) {
  const percent =
    mission.target > 0
      ? Math.min(100, Math.round((mission.progress / mission.target) * 100))
      : 0;

  return (
    <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-semibold text-white">{mission.title}</div>
          <div className="mt-1 text-[12px] leading-5 text-neutral-400">
            {mission.description}
          </div>
        </div>

        <div
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
            mission.isComplete
              ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
              : "border border-white/10 bg-white/[0.04] text-neutral-300"
          }`}
        >
          +{mission.rewardXp} XP
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
        <span>
          {mission.progress}/{mission.target} {mission.unitLabel}
        </span>
        <span>{percent}%</span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            mission.isComplete
              ? "bg-[linear-gradient(90deg,rgba(16,185,129,1)_0%,rgba(34,197,94,1)_100%)]"
              : "bg-[linear-gradient(90deg,rgba(59,130,246,1)_0%,rgba(139,92,246,1)_100%)]"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function ProfileMissionsCard({
  missions,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.11),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5">
        <div className="text-sm text-neutral-500">Loading missions...</div>
      </div>
    );
  }

  if (!missions) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.11),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5">
        <div className="text-sm text-neutral-500">No missions yet.</div>
      </div>
    );
  }

  const streakPercent =
    missions.streakReward?.nextTarget > 0
      ? Math.min(
          100,
          Math.round(
            ((missions.streakReward.currentBestStreak || 0) /
              missions.streakReward.nextTarget) *
              100
          )
        )
      : 0;

  return (
    <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.11),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-amber-200/75">
            Momentum
          </div>
          <div className="mt-1 text-[22px] font-semibold tracking-[-0.04em] text-white">Daily and weekly missions</div>
          <div className="mt-1 text-[12px] leading-5 text-neutral-400">
            Short-term goals give people a reason to come back before the board resets.
          </div>
        </div>

        <div className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100">
          Momentum
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Daily missions
          </div>
          {(missions.dailyMissions || []).map((mission) => (
            <MissionProgress key={mission.id} mission={mission} />
          ))}
        </div>

        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Weekly missions
          </div>
          {(missions.weeklyMissions || []).map((mission) => (
            <MissionProgress key={mission.id} mission={mission} />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-orange-400/18 bg-orange-500/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-orange-100/75">
              Streak reward
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              Best streak x{missions.streakReward?.currentBestStreak ?? 0}
            </div>
            <div className="mt-1 text-[12px] leading-5 text-orange-100/80">
              Push to x{missions.streakReward?.nextTarget ?? 0} for{" "}
              {missions.streakReward?.rewardLabel || "your next streak reward"} and +
              {missions.streakReward?.rewardXp ?? 0} XP.
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
            x{missions.streakReward?.nextTarget ?? 0}
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(249,115,22,1)_0%,rgba(245,158,11,1)_100%)] transition-all duration-500"
            style={{ width: `${streakPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
