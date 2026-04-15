function iconFor(key) {
  switch (key) {
    case "crown":
      return "👑";
    case "trophy":
      return "🏆";
    case "medal":
      return "🥉";
    case "flame":
      return "🔥";
    case "bolt":
      return "⚡";
    case "target":
      return "🎯";
    case "calendar":
      return "🗓️";
    case "star":
      return "⭐";
    default:
      return "🏅";
  }
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function ProfileAchievementsCard({
  progression,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
        <div className="text-sm text-neutral-500">Loading achievements...</div>
      </div>
    );
  }

  const achievements = progression?.recentAchievements || [];

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 text-sm font-semibold text-white">
        Recent achievements
      </div>

      {achievements.length === 0 ? (
        <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-4 py-6 text-sm text-neutral-500">
          No achievements earned yet.
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.map((achievement) => (
            <div
              key={`${achievement.code}-${achievement.earnedAt}`}
              className="rounded-[18px] border border-white/6 bg-white/[0.03] px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <div className="text-xl">{iconFor(achievement.iconKey)}</div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">
                      {achievement.name}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {formatDate(achievement.earnedAt)}
                    </div>
                  </div>

                  <div className="mt-1 text-[12px] text-neutral-400">
                    {achievement.description}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-violet-200">
                      {achievement.badgeLabel}
                    </span>

                    <span className="text-[11px] text-blue-300">
                      +{achievement.xpReward} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}