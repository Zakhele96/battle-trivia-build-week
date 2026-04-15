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

export default function AchievementToastStack({ achievements = [] }) {
  if (!achievements.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-[70] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:right-4 sm:items-end">
      {achievements.map((achievement, index) => (
        <div
          key={`${achievement.code}-${achievement.earnedAt}-${index}`}
          className="w-full max-w-[22rem] rounded-[20px] border border-violet-400/20 bg-[linear-gradient(180deg,rgba(45,27,86,0.96)_0%,rgba(22,16,42,0.98)_100%)] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        >
          <div className="flex items-start gap-3">
            <div className="text-xl">{iconFor(achievement.iconKey)}</div>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
                Achievement unlocked
              </div>

              <div className="mt-1 text-sm font-semibold text-white">
                {achievement.name}
              </div>

              <div className="mt-1 text-[12px] text-violet-100/75">
                {achievement.description}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full border border-violet-300/20 bg-violet-300/12 px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-100">
                  {achievement.badgeLabel}
                </span>

                <span className="text-[11px] font-medium text-blue-300">
                  +{achievement.xpReward} XP
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}