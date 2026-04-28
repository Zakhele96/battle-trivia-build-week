import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";

function getAccentStyles(accent, isLight) {
  if (accent === "violet") {
    return isLight
      ? {
          badge: "border-violet-300 bg-violet-50 text-violet-700",
          score: "text-violet-700",
          iconBg: "bg-violet-100 text-violet-700",
        }
      : {
          badge: "border-violet-400/18 bg-violet-500/10 text-violet-200",
          score: "text-violet-200",
          iconBg: "bg-violet-500/12",
        };
  }

  return isLight
    ? {
        badge: "border-sky-300 bg-sky-50 text-sky-800",
        score: "text-sky-800",
        iconBg: "bg-sky-100 text-sky-800",
      }
    : {
        badge: "border-blue-400/18 bg-blue-500/10 text-blue-200",
        score: "text-blue-200",
        iconBg: "bg-blue-500/12",
      };
}

function Crown({ rank }) {
  if (rank === 1) {
    return (
      <span aria-hidden="true" className="emoji-native">
        👑
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span aria-hidden="true" className="emoji-native">
        🥈
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span aria-hidden="true" className="emoji-native">
        🥉
      </span>
    );
  }
  return null;
}

function EmptyState({ isLight }) {
  return (
    <div
      className={`rounded-[14px] border px-3 py-4 text-center text-[12px] ${
        isLight
          ? "border-stone-200 bg-white/76 text-stone-500"
          : "border-white/8 bg-black/20 text-neutral-500"
      }`}
    >
      No rankings yet.
    </div>
  );
}

function Row({ row, accent, isLight }) {
  const accentStyles = getAccentStyles(accent, isLight);
  const isTop = row.rank <= 3;
  const rowClassName = isTop
    ? isLight
      ? "border-stone-200 bg-white/78"
      : "border-white/10 bg-white/[0.035]"
    : isLight
    ? "border-stone-200 bg-[#f3e6d5]/62"
    : "border-white/6 bg-black/20";
  const nameClassName = isLight ? "text-stone-900" : "text-white";
  const usernameClassName = isLight ? "text-stone-500" : "text-neutral-500";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[16px] border px-3 py-3 sm:rounded-[14px] sm:py-2.5 ${rowClassName}`}
    >
      <div className="min-w-0 flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
            isTop ? accentStyles.iconBg : isLight ? "bg-stone-100 text-stone-700" : "bg-white/[0.05]"
          }`}
        >
          {row.rank}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className={`truncate text-[13px] font-semibold ${nameClassName}`}>
              {row.displayName || row.username}
            </div>
            {isTop ? <Crown rank={row.rank} /> : null}
          </div>

          <div className={`truncate text-[10px] ${usernameClassName}`}>
            @{row.username}
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className={`text-[14px] font-semibold ${accentStyles.score}`}>
          {row.score}
        </div>
        <div className={`text-[9px] uppercase tracking-[0.12em] ${usernameClassName}`}>
          pts
        </div>
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
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const accentStyles = getAccentStyles(accent, isLight);
  const cardClassName = isLight
    ? "group rounded-[20px] border border-[#ddc8a8] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,232,216,0.95))] p-3.5 shadow-[0_16px_28px_rgba(114,84,41,0.1)] transition hover:border-[#cda768] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(247,238,224,1))] sm:rounded-[22px] sm:p-4"
    : "group rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] sm:rounded-[22px] sm:p-4";
  const subtitleClassName = isLight
    ? "mt-2 text-[12px] leading-5 text-stone-600"
    : "mt-2 text-[12px] leading-5 text-neutral-400";
  const openClassName = isLight
    ? "shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500 transition group-hover:text-stone-800"
    : "shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500 transition group-hover:text-neutral-300";
  const leader = rows[0] || null;
  const effectiveSubtitle =
    title === "Battle Trivia race"
      ? "Current week · Top 3 on the main Battle Trivia board"
      : subtitle;

  return (
    <Link to={to} className={cardClassName}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${accentStyles.badge}`}
            >
              {title}
            </div>
          </div>

          <div className={subtitleClassName}>{effectiveSubtitle}</div>
        </div>

        <div className={openClassName}>Open →</div>
      </div>

      <div className="mt-3 space-y-2.5">
        {rows.length === 0 ? (
          <EmptyState isLight={isLight} />
        ) : (
          rows.slice(0, 3).map((row) => (
            <Row
              key={row.userId || `${row.username}-${row.rank}`}
              row={row}
              accent={accent}
              isLight={isLight}
            />
          ))
        )}
      </div>

      {leader ? (
        <div
          className={`mt-3 rounded-[14px] border px-3 py-2 text-[11px] leading-4 ${
            isLight
              ? "border-stone-200 bg-white/72 text-stone-600"
              : "border-white/8 bg-black/20 text-neutral-300"
          }`}
        >
          <span className={isLight ? "text-stone-900" : "text-white"}>
            {leader.displayName || leader.username}
          </span>{" "}
          is leading this Battle Trivia race with {leader.score} points.
        </div>
      ) : null}
    </Link>
  );
}
