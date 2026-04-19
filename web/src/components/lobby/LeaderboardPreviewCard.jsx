import { Link } from "react-router-dom";

function getAccentStyles(accent) {
  if (accent === "violet") {
    return {
      badge: "border-violet-400/18 bg-violet-500/10 text-violet-200",
      glow: "from-violet-500/10",
      score: "text-violet-200",
      iconBg: "bg-violet-500/12",
    };
  }

  return {
    badge: "border-blue-400/18 bg-blue-500/10 text-blue-200",
    glow: "from-blue-500/10",
    score: "text-blue-200",
    iconBg: "bg-blue-500/12",
  };
}

function Crown({ rank }) {
  if (rank === 1) return <span aria-hidden="true">👑</span>;
  if (rank === 2) return <span aria-hidden="true">🥈</span>;
  if (rank === 3) return <span aria-hidden="true">🥉</span>;
  return null;
}

function EmptyState() {
  return (
    <div className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-4 text-center text-[12px] text-neutral-500">
      No rankings yet.
    </div>
  );
}

function Row({ row, accent }) {
  const accentStyles = getAccentStyles(accent);
  const isTop = row.rank <= 3;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[14px] border px-3 py-2.5 ${
        isTop
          ? "border-white/10 bg-white/[0.035]"
          : "border-white/6 bg-black/20"
      }`}
    >
      <div className="min-w-0 flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
            isTop ? accentStyles.iconBg : "bg-white/[0.05]"
          }`}
        >
          {row.rank}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="truncate text-[13px] font-semibold text-white">
              {row.displayName || row.username}
            </div>
            {isTop ? <Crown rank={row.rank} /> : null}
          </div>

          <div className="truncate text-[10px] text-neutral-500">
            @{row.username}
          </div>
        </div>
      </div>

      <div className={`shrink-0 text-[13px] font-semibold ${accentStyles.score}`}>
        {row.score}
      </div>
    </div>
  );
}

export default function LeaderboardPreviewCard({
  title,
  subtitle,
  rows = [],
  to,
  accent = "blue",
}) {
  const accentStyles = getAccentStyles(accent);

  return (
    <Link
      to={to}
      className={`group rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] sm:rounded-[22px] sm:p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${accentStyles.badge}`}
            >
              {title}
            </div>
          </div>

          <div className="mt-2 text-[12px] leading-5 text-neutral-400">
            {subtitle}
          </div>
        </div>

        <div className="shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500 transition group-hover:text-neutral-300">
          Open →
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          rows.slice(0, 3).map((row) => (
            <Row
              key={row.userId || `${row.username}-${row.rank}`}
              row={row}
              accent={accent}
            />
          ))
        )}
      </div>
    </Link>
  );
}