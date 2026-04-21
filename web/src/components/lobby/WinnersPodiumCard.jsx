import { Link } from "react-router-dom";

function getPlacementTone(rank) {
  if (rank === 1) {
    return {
      badge: "border-amber-300/25 bg-amber-400/14 text-amber-100",
      panel:
        "border-amber-300/18 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_60%),linear-gradient(180deg,rgba(251,191,36,0.12),rgba(255,255,255,0.04))]",
      score: "text-amber-100",
      block: "from-amber-300/30 via-amber-400/18 to-amber-500/28",
      shadow: "shadow-[0_20px_40px_rgba(245,158,11,0.14)]",
      height: "h-40 sm:h-48",
      order: "lg:order-2",
      glow: "podium-float-medium",
    };
  }

  if (rank === 2) {
    return {
      badge: "border-slate-300/20 bg-slate-300/10 text-slate-100",
      panel:
        "border-slate-300/15 bg-[radial-gradient(circle_at_top,rgba(226,232,240,0.1),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))]",
      score: "text-slate-100",
      block: "from-slate-200/22 via-slate-300/14 to-slate-500/22",
      shadow: "shadow-[0_16px_30px_rgba(148,163,184,0.12)]",
      height: "h-28 sm:h-34",
      order: "lg:order-1",
      glow: "podium-float-slow",
    };
  }

  return {
    badge: "border-orange-300/20 bg-orange-400/10 text-orange-100",
    panel:
      "border-orange-300/15 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.14),transparent_60%),linear-gradient(180deg,rgba(251,146,60,0.08),rgba(255,255,255,0.025))]",
    score: "text-orange-100",
    block: "from-orange-300/24 via-orange-400/14 to-orange-600/22",
    shadow: "shadow-[0_16px_30px_rgba(249,115,22,0.12)]",
    height: "h-24 sm:h-30",
    order: "lg:order-3",
    glow: "podium-float-fast",
  };
}

function PodiumColumn({ winner }) {
  const tone = getPlacementTone(winner.rank);

  return (
    <div
      className={`flex flex-col justify-end ${tone.order} ${tone.glow}`}
    >
      <div
        className={`rounded-[22px] border px-4 pb-4 pt-3 ${tone.panel} ${tone.shadow}`}
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${tone.badge}`}
          >
            #{winner.rank}
          </span>

          <span className={`text-sm font-semibold ${tone.score}`}>
            {winner.score} pts
          </span>
        </div>

        <div className="mt-4">
          <div className="truncate text-base font-semibold tracking-[-0.03em] text-white">
            {winner.displayName || winner.username}
          </div>
          <div className="mt-1 truncate text-[11px] text-neutral-400">
            @{winner.username}
          </div>
        </div>

        <div
          className={`mt-4 flex items-end justify-center rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.16))] ${tone.height}`}
        >
          <div
            className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b ${tone.block} text-lg font-semibold text-white backdrop-blur`}
          >
            {winner.rank}
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
  const ordered = [2, 1, 3]
    .map((rank) => winners.find((entry) => entry.rank === rank))
    .filter(Boolean);

  if (ordered.length === 0) return null;

  const champion = winners.find((entry) => entry.rank === 1) || ordered[0];

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
              `${champion.displayName || champion.username} took the top spot. The latest Battle Trivia finish now leads the lobby instead of another dense leaderboard preview.`}
          </div>
        </div>

        <Link
          to={to}
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white transition hover:border-white/20 hover:bg-white/[0.06]"
        >
          Full standings
        </Link>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3 lg:items-end">
        {ordered.map((winner) => (
          <PodiumColumn
            key={winner.userId || `${winner.username}-${winner.rank}`}
            winner={winner}
          />
        ))}
      </div>
    </div>
  );
}
