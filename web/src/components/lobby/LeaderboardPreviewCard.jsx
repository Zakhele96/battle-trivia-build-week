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
      className="block rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-3 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] sm:rounded-[24px] sm:p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
            {title}
          </div>
          <div className="mt-1 text-[13px] text-neutral-300 sm:text-sm">
            {subtitle}
          </div>
        </div>

        <div
          className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] sm:px-3 sm:text-[10px] ${accentClass}`}
        >
          Top 3
        </div>
      </div>

      <div className="mt-3 space-y-2 sm:mt-4">
        {rows.length === 0 ? (
          <div className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-3 text-[13px] text-neutral-500 sm:rounded-[16px] sm:text-sm">
            No standings yet.
          </div>
        ) : (
          rows.slice(0, 3).map((row) => (
            <div
              key={row.userId}
              className="flex items-center justify-between rounded-[14px] border border-white/8 bg-black/20 px-3 py-2 sm:rounded-[16px] sm:py-2.5"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-white sm:text-sm">
                  #{row.rank} {row.displayName || row.username}
                </div>
                <div className="truncate text-[10px] text-neutral-500 sm:text-[11px]">
                  @{row.username}
                </div>
              </div>

              <div className="ml-3 text-[13px] font-semibold text-blue-300 sm:text-sm">
                {row.score}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400 sm:mt-4 sm:text-[11px]">
        View full standings
        <span aria-hidden="true">→</span>
      </div>
    </Link>
  );
}