import { Link } from "react-router-dom";

function getPlacementTone(rank) {
  if (rank === 1) {
    return {
      shell:
        "border-amber-300/24 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.24),transparent_62%),linear-gradient(180deg,rgba(251,191,36,0.16),rgba(255,255,255,0.04))]",
      badge: "border-amber-300/30 bg-amber-400/16 text-amber-100",
      score: "text-amber-100",
      block:
        "border-amber-300/22 bg-[linear-gradient(180deg,rgba(251,191,36,0.24),rgba(180,83,9,0.22))]",
      rim: "bg-[linear-gradient(180deg,rgba(253,224,71,0.55),rgba(251,191,36,0.18))]",
      glow: "shadow-[0_26px_48px_rgba(245,158,11,0.18)]",
      lift: "h-28 sm:h-32",
      order: "order-2",
      floatClass: "podium-float-medium",
    };
  }

  if (rank === 2) {
    return {
      shell:
        "border-slate-300/18 bg-[radial-gradient(circle_at_top,rgba(226,232,240,0.16),transparent_62%),linear-gradient(180deg,rgba(226,232,240,0.08),rgba(255,255,255,0.028))]",
      badge: "border-slate-300/22 bg-slate-300/12 text-slate-100",
      score: "text-slate-100",
      block:
        "border-slate-300/18 bg-[linear-gradient(180deg,rgba(226,232,240,0.15),rgba(71,85,105,0.22))]",
      rim: "bg-[linear-gradient(180deg,rgba(255,255,255,0.4),rgba(226,232,240,0.14))]",
      glow: "shadow-[0_18px_34px_rgba(148,163,184,0.14)]",
      lift: "h-20 sm:h-24",
      order: "order-1",
      floatClass: "podium-float-slow",
    };
  }

  return {
    shell:
      "border-orange-300/18 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.16),transparent_62%),linear-gradient(180deg,rgba(251,146,60,0.1),rgba(255,255,255,0.028))]",
    badge: "border-orange-300/22 bg-orange-400/12 text-orange-100",
    score: "text-orange-100",
    block:
      "border-orange-300/18 bg-[linear-gradient(180deg,rgba(251,146,60,0.16),rgba(154,52,18,0.22))]",
    rim: "bg-[linear-gradient(180deg,rgba(254,215,170,0.42),rgba(251,146,60,0.12))]",
    glow: "shadow-[0_18px_34px_rgba(249,115,22,0.14)]",
    lift: "h-16 sm:h-20",
    order: "order-3",
    floatClass: "podium-float-fast",
  };
}

function PodiumSpot({ winner }) {
  const tone = getPlacementTone(winner.rank);

  return (
    <div className={`flex min-w-0 flex-col justify-end ${tone.order}`}>
      <div className={`relative z-10 px-1 ${tone.floatClass}`}>
        <div
          className={`rounded-[20px] border px-3 pb-3 pt-3 backdrop-blur-sm sm:px-4 ${tone.shell} ${tone.glow}`}
        >
          <div className="flex items-start justify-between gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${tone.badge}`}
            >
              #{winner.rank}
            </span>

            <div className={`text-sm font-semibold ${tone.score}`}>
              {winner.score} pts
            </div>
          </div>

          <div className="mt-3 min-w-0">
            <div className="truncate text-[14px] font-semibold tracking-[-0.03em] text-white sm:text-[15px]">
              {winner.displayName || winner.username}
            </div>
            <div className="mt-1 truncate text-[11px] text-neutral-400">
              @{winner.username}
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-3">
        <div
          className={`relative overflow-hidden rounded-t-[22px] border border-b-0 ${tone.block} ${tone.lift}`}
        >
          <div className={`absolute inset-x-0 top-0 h-1.5 ${tone.rim}`} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_28%,rgba(0,0,0,0.16))]" />
          <div className="absolute inset-x-3 bottom-0 h-4 rounded-t-[14px] bg-black/14 blur-md" />
          <div className="relative flex h-full items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-black/16 text-lg font-semibold text-white backdrop-blur-sm">
              {winner.rank}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WinnersPodiumCard({
  title = "Latest winners",
  subtitle,
  winners = [],
  to = "/leaderboards?mode=battle-trivia&period=previous",
}) {
  const spots = [2, 1, 3]
    .map((rank) => winners.find((entry) => entry.rank === rank))
    .filter(Boolean);

  if (spots.length === 0) return null;

  const champion = winners.find((entry) => entry.rank === 1) || spots[0];

  return (
    <div className="mt-3 rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.16)] sm:mt-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[34rem]">
          <div className="text-[10px] uppercase tracking-[0.18em] text-blue-200/70 sm:text-[11px]">
            Winners circle
          </div>
          <div className="mt-1 text-[22px] font-semibold tracking-[-0.04em] text-white sm:text-[28px]">
            {title}
          </div>
          <div className="mt-2 text-[13px] leading-6 text-neutral-300 sm:text-[14px]">
            {subtitle ||
              `${champion.displayName || champion.username} finished on top, with the full podium raised underneath so the result reads instantly.`}
          </div>
        </div>

        <Link
          to={to}
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white transition hover:border-white/20 hover:bg-white/[0.06]"
        >
          Full standings
        </Link>
      </div>

      <div className="mt-5">
        <div className="grid grid-cols-3 items-end gap-2 sm:gap-3">
          {spots.map((winner) => (
            <PodiumSpot
              key={winner.userId || `${winner.username}-${winner.rank}`}
              winner={winner}
            />
          ))}
        </div>

        <div className="relative">
          <div className="h-3 rounded-b-[22px] border border-white/10 border-t-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))]" />
          <div className="absolute inset-x-4 top-1 h-5 rounded-full bg-blue-500/8 blur-xl" />
        </div>
      </div>
    </div>
  );
}
