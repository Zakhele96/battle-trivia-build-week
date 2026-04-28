import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";

function getInitials(value) {
  if (!value) return "P";

  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function getPlacementTone(rank, isLight) {
  if (isLight) {
    if (rank === 1) {
      return {
        shell:
          "border-amber-300 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.3),transparent_65%),linear-gradient(180deg,#fff8e7,#f4ddaa)]",
        badge: "border-amber-300 bg-amber-100 text-amber-800",
        score: "text-amber-800",
        name: "text-stone-900",
        username: "text-stone-500",
        block:
          "border-amber-300 bg-[linear-gradient(180deg,#f8e2a7,#e0a935)]",
        rim: "bg-[linear-gradient(180deg,rgba(255,251,235,0.95),rgba(251,191,36,0.42))]",
        glow: "shadow-[0_20px_34px_rgba(217,119,6,0.16)]",
        pedestalOverlay:
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.24),transparent_28%,rgba(120,53,15,0.14))]",
        pedestalShadow: "bg-amber-950/12",
        medal: "border-amber-200 bg-white/82 text-amber-800",
        avatarShell:
          "border-amber-200 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(255,244,214,0.88))] shadow-[0_12px_22px_rgba(217,119,6,0.14)]",
        avatarRing: "border-amber-300/80",
        spark: "bg-amber-300/70",
        lift: "h-28 sm:h-32",
        order: "order-2",
        floatClass: "podium-float-medium",
      };
    }

    if (rank === 2) {
      return {
        shell:
          "border-slate-300 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.18),transparent_62%),linear-gradient(180deg,#ffffff,#e5ebf3)]",
        badge: "border-slate-300 bg-slate-100 text-slate-700",
        score: "text-slate-700",
        name: "text-stone-900",
        username: "text-stone-500",
        block:
          "border-slate-300 bg-[linear-gradient(180deg,#eef2f7,#b8c4d5)]",
        rim: "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(148,163,184,0.32))]",
        glow: "shadow-[0_16px_28px_rgba(100,116,139,0.14)]",
        pedestalOverlay:
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.22),transparent_28%,rgba(71,85,105,0.14))]",
        pedestalShadow: "bg-slate-950/10",
        medal: "border-slate-200 bg-white/80 text-slate-700",
        avatarShell:
          "border-slate-200 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(232,239,247,0.9))] shadow-[0_10px_18px_rgba(100,116,139,0.12)]",
        avatarRing: "border-slate-300/70",
        spark: "",
        lift: "h-20 sm:h-24",
        order: "order-1",
        floatClass: "podium-float-slow",
      };
    }

    return {
      shell:
        "border-orange-300 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.2),transparent_62%),linear-gradient(180deg,#fff4ec,#f2d2bd)]",
      badge: "border-orange-300 bg-orange-100 text-orange-800",
      score: "text-orange-800",
      name: "text-stone-900",
      username: "text-stone-500",
      block:
        "border-orange-300 bg-[linear-gradient(180deg,#f7dcc8,#d79063)]",
      rim: "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(251,146,60,0.28))]",
      glow: "shadow-[0_16px_28px_rgba(194,65,12,0.12)]",
      pedestalOverlay:
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.2),transparent_28%,rgba(124,45,18,0.12))]",
      pedestalShadow: "bg-orange-950/10",
      medal: "border-orange-200 bg-white/78 text-orange-800",
      avatarShell:
        "border-orange-200 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(255,235,222,0.9))] shadow-[0_10px_18px_rgba(194,65,12,0.1)]",
      avatarRing: "border-orange-300/70",
      spark: "",
      lift: "h-16 sm:h-20",
      order: "order-3",
      floatClass: "podium-float-fast",
    };
  }

  if (rank === 1) {
    return {
      shell:
        "border-amber-300/24 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.24),transparent_62%),linear-gradient(180deg,rgba(251,191,36,0.16),rgba(255,255,255,0.04))]",
      badge: "border-amber-300/30 bg-amber-400/16 text-amber-100",
      score: "text-amber-100",
      name: "text-white",
      username: "text-neutral-400",
      block:
        "border-amber-300/22 bg-[linear-gradient(180deg,rgba(251,191,36,0.24),rgba(180,83,9,0.22))]",
      rim: "bg-[linear-gradient(180deg,rgba(253,224,71,0.55),rgba(251,191,36,0.18))]",
      glow: "shadow-[0_26px_48px_rgba(245,158,11,0.18)]",
      pedestalOverlay:
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_28%,rgba(0,0,0,0.16))]",
      pedestalShadow: "bg-black/14",
      medal: "border-white/12 bg-black/16 text-white",
      avatarShell:
        "border-amber-300/22 bg-[radial-gradient(circle_at_top,rgba(253,224,71,0.24),rgba(17,24,39,0.92))] shadow-[0_16px_28px_rgba(245,158,11,0.16)]",
      avatarRing: "border-amber-300/70",
      spark: "bg-amber-200/70",
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
      name: "text-white",
      username: "text-neutral-400",
      block:
        "border-slate-300/18 bg-[linear-gradient(180deg,rgba(226,232,240,0.15),rgba(71,85,105,0.22))]",
      rim: "bg-[linear-gradient(180deg,rgba(255,255,255,0.4),rgba(226,232,240,0.14))]",
      glow: "shadow-[0_18px_34px_rgba(148,163,184,0.14)]",
      pedestalOverlay:
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_28%,rgba(0,0,0,0.16))]",
      pedestalShadow: "bg-black/14",
      medal: "border-white/12 bg-black/16 text-white",
      avatarShell:
        "border-slate-300/18 bg-[radial-gradient(circle_at_top,rgba(226,232,240,0.18),rgba(15,23,42,0.92))] shadow-[0_14px_24px_rgba(148,163,184,0.12)]",
      avatarRing: "border-slate-200/60",
      spark: "",
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
    name: "text-white",
    username: "text-neutral-400",
    block:
      "border-orange-300/18 bg-[linear-gradient(180deg,rgba(251,146,60,0.16),rgba(154,52,18,0.22))]",
    rim: "bg-[linear-gradient(180deg,rgba(254,215,170,0.42),rgba(251,146,60,0.12))]",
    glow: "shadow-[0_18px_34px_rgba(249,115,22,0.14)]",
    pedestalOverlay:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_28%,rgba(0,0,0,0.16))]",
    pedestalShadow: "bg-black/14",
    medal: "border-white/12 bg-black/16 text-white",
    avatarShell:
      "border-orange-300/18 bg-[radial-gradient(circle_at_top,rgba(254,215,170,0.16),rgba(24,24,27,0.92))] shadow-[0_14px_24px_rgba(249,115,22,0.12)]",
    avatarRing: "border-orange-200/60",
    spark: "",
    lift: "h-16 sm:h-20",
    order: "order-3",
    floatClass: "podium-float-fast",
  };
}

function WinnerAvatar({ winner, tone, isLight }) {
  const displayName = winner.displayName || winner.username;
  const initials = getInitials(displayName);
  const fallbackClassName = isLight ? "text-stone-900" : "text-white";
  const showSpark = winner.rank === 1 && tone.spark;

  return (
    <div className={`relative mx-auto w-fit ${tone.floatClass}`}>
      {showSpark ? (
        <>
          <div className={`absolute -left-2 top-3 h-2.5 w-2.5 rounded-full blur-[1px] ${tone.spark}`} />
          <div className={`absolute -right-2 top-6 h-1.5 w-1.5 rounded-full ${tone.spark}`} />
          <div className={`absolute left-1/2 top-[-0.45rem] h-3 w-3 -translate-x-1/2 rounded-full blur-[1px] ${tone.spark}`} />
        </>
      ) : null}
      <div className={`relative overflow-hidden rounded-full border p-1.5 backdrop-blur-sm ${tone.avatarShell}`}>
        <div className={`rounded-full border p-0.5 ${tone.avatarRing}`}>
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-black/10 sm:h-[4.5rem] sm:w-[4.5rem]">
            {winner.avatarUrl ? (
              <img
                src={winner.avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className={`text-lg font-semibold sm:text-xl ${fallbackClassName}`}>
                {initials}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PodiumSpot({ winner, isLight }) {
  const tone = getPlacementTone(winner.rank, isLight);

  return (
    <div className={`flex min-w-0 flex-col justify-end ${tone.order}`}>
      <div className="relative z-10 px-1">
        <WinnerAvatar winner={winner} tone={tone} isLight={isLight} />

        <div
          className={`-mt-1 rounded-[20px] border px-2.5 pb-2.5 pt-3.5 backdrop-blur-sm sm:-mt-2 sm:rounded-[22px] sm:px-4 sm:pb-3 sm:pt-4 ${tone.shell} ${tone.glow}`}
        >
          <div className="flex justify-center">
            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em] sm:px-2.5 sm:py-1 sm:text-[10px] ${tone.badge}`}
            >
              #{winner.rank}
            </span>
          </div>

          <div className="mt-2 min-w-0 text-center">
            <div
              className={`truncate text-[13px] font-semibold tracking-[-0.03em] sm:text-[15px] ${tone.name}`}
            >
              {winner.displayName || winner.username}
            </div>
            <div className={`mt-0.5 hidden truncate text-[11px] sm:block ${tone.username}`}>
              @{winner.username}
            </div>
            <div className={`mt-1 text-[12px] font-semibold sm:text-sm ${tone.score}`}>
              {winner.score} pts
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-2.5 sm:mt-3">
        <div
          className={`relative overflow-hidden rounded-t-[22px] border border-b-0 ${tone.block} ${tone.lift}`}
        >
          <div className={`absolute inset-x-0 top-0 h-1.5 ${tone.rim}`} />
          <div className={`absolute inset-0 ${tone.pedestalOverlay}`} />
          <div
            className={`absolute inset-x-3 bottom-0 h-4 rounded-t-[14px] blur-md ${tone.pedestalShadow}`}
          />
          <div className="relative flex h-full items-center justify-center">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full border text-lg font-semibold backdrop-blur-sm ${tone.medal}`}
            >
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
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const spots = [2, 1, 3]
    .map((rank) => winners.find((entry) => entry.rank === rank))
    .filter(Boolean);

  if (spots.length === 0) return null;

  const champion = winners.find((entry) => entry.rank === 1) || spots[0];
  const cardClassName = isLight
    ? "mt-3 rounded-[24px] border border-[#d9c4a0] bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_36%),linear-gradient(180deg,#fffaf1,#f2e5d2)] p-4 shadow-[0_18px_34px_rgba(120,82,37,0.14)] sm:mt-4 sm:p-5"
    : "mt-3 rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.16)] sm:mt-4 sm:p-5";
  const eyebrowClassName = isLight
    ? "text-[10px] uppercase tracking-[0.18em] text-amber-700/80 sm:text-[11px]"
    : "text-[10px] uppercase tracking-[0.18em] text-blue-200/70 sm:text-[11px]";
  const titleClassName = isLight
    ? "mt-1 text-[22px] font-semibold tracking-[-0.04em] text-stone-900 sm:text-[28px]"
    : "mt-1 text-[22px] font-semibold tracking-[-0.04em] text-white sm:text-[28px]";
  const subtitleClassName = isLight
    ? "mt-2 text-[13px] leading-6 text-stone-600 sm:text-[14px]"
    : "mt-2 text-[13px] leading-6 text-neutral-300 sm:text-[14px]";
  const openClassName = isLight
    ? "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f5fa8] transition group-hover:text-[#0b4f8e]"
    : "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200 transition group-hover:text-white";
  const baseClassName = isLight
    ? "h-3 rounded-b-[22px] border border-[#d9c4a0] border-t-0 bg-[linear-gradient(180deg,#f4e7d2,#ead9c0)]"
    : "h-3 rounded-b-[22px] border border-white/10 border-t-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))]";
  const baseGlowClassName = isLight
    ? "absolute inset-x-4 top-1 h-5 rounded-full bg-amber-400/14 blur-xl"
    : "absolute inset-x-4 top-1 h-5 rounded-full bg-blue-500/8 blur-xl";

  return (
    <Link to={to} className={`group block ${cardClassName}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[34rem]">
          <div className={eyebrowClassName}>Winners circle</div>
          <div className={titleClassName}>{title}</div>
          <div className={subtitleClassName}>
            {subtitle ||
              `${champion.displayName || champion.username} finished on top in the latest Battle Trivia result.`}
          </div>
        </div>

        <div className={`${openClassName} hidden sm:inline-flex`}>
          Open standings
          <span aria-hidden="true">&rarr;</span>
        </div>
      </div>

      <div className="mt-6 sm:mt-7">
        <div className="grid grid-cols-3 items-end gap-2.5 sm:gap-3">
          {spots.map((winner) => (
            <PodiumSpot
              key={winner.userId || `${winner.username}-${winner.rank}`}
              isLight={isLight}
              winner={winner}
            />
          ))}
        </div>

        <div className="relative">
          <div className={baseClassName} />
          <div className={baseGlowClassName} />
        </div>
      </div>
    </Link>
  );
}
