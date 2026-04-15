import { Link } from "react-router-dom";

export default function LeaderboardPreviewCard({
  title,
  subtitle,
  rows = [],
  to,
  accent = "blue",
}) {
  const accentClass =
    accent === "violet"
      ? "text-violet-300 border-violet-400/20 bg-violet-500/10"
      : accent === "amber"
      ? "text-amber-300 border-amber-400/20 bg-amber-500/10"
      : "text-blue-300 border-blue-400/20 bg-blue-500/10";

  return (
    <Link
      to={to}
      className="block rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            {title}
          </div>
          <div className="mt-1 text-sm text-neutral-300">{subtitle}</div>
        </div>

        <div
          className={`rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${accentClass}`}
        >
          Top 3
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-3 text-sm text-neutral-500">
            No standings yet.
          </div>
        ) : (
          rows.slice(0, 3).map((row) => (
            <div
              key={row.userId}
              className="flex items-center justify-between rounded-[16px] border border-white/8 bg-black/20 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-white">
                  #{row.rank} {row.displayName || row.username}
                </div>
                <div className="truncate text-[11px] text-neutral-500">
                  @{row.username}
                </div>
              </div>

              <div className="ml-3 text-sm font-semibold text-blue-300">
                {row.score}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
        View full standings
        <span aria-hidden="true">→</span>
      </div>
    </Link>
  );
}