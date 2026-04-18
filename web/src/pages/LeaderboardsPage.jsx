import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getLeaderboard } from "../api/leaderboardsApi";
import AppTopBar from "../components/layout/AppTopBar";
import AppSectionNav from "../components/layout/AppSectionNav";

const MODES = [
  { key: "combined", label: "Combined" },
  { key: "battle-trivia", label: "Battle Trivia" },
  { key: "word-scramble", label: "Word Scramble" },
];

const PERIODS = [
  { key: "current", label: "Current week" },
  { key: "previous", label: "Previous week" },
];

function formatEndedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getModeLabel(mode) {
  return MODES.find((item) => item.key === mode)?.label || "Combined";
}

function getPeriodLabel(period) {
  return PERIODS.find((item) => item.key === period)?.label || "Current week";
}

function getRankTone(rank) {
  if (rank === 1) {
    return {
      shell: "border-amber-400/20 bg-amber-500/10",
      badge: "bg-amber-400/15 text-amber-200",
      score: "text-amber-200",
      glow: "shadow-[0_14px_34px_rgba(245,158,11,0.12)]",
      icon: "👑",
    };
  }

  if (rank === 2) {
    return {
      shell: "border-slate-300/15 bg-slate-400/10",
      badge: "bg-slate-300/15 text-slate-200",
      score: "text-slate-200",
      glow: "shadow-[0_12px_28px_rgba(148,163,184,0.08)]",
      icon: "🥈",
    };
  }

  if (rank === 3) {
    return {
      shell: "border-orange-400/15 bg-orange-500/10",
      badge: "bg-orange-400/15 text-orange-200",
      score: "text-orange-200",
      glow: "shadow-[0_12px_28px_rgba(249,115,22,0.08)]",
      icon: "🥉",
    };
  }

  return {
    shell: "border-white/8 bg-white/[0.03]",
    badge: "bg-white/[0.05] text-neutral-300",
    score: "text-blue-300",
    glow: "shadow-[0_10px_24px_rgba(0,0,0,0.12)]",
    icon: null,
  };
}

function FilterPill({ active, onClick, children, accent = "blue" }) {
  const activeClass =
    accent === "violet"
      ? "bg-violet-500 text-white"
      : "bg-blue-500 text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? activeClass
          : "border border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.05]"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function PodiumCard({ row, mode }) {
  const tone = getRankTone(row.rank);

  return (
    <div
      className={`rounded-[22px] border p-4 ${tone.shell} ${tone.glow}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${tone.badge}`}
            >
              #{row.rank}
            </span>
            {tone.icon ? <span aria-hidden="true">{tone.icon}</span> : null}
          </div>

          <div className="mt-3 truncate text-base font-semibold text-white">
            {row.displayName || row.username}
          </div>

          <div className="mt-1 text-[11px] text-neutral-500">
            @{row.username}
          </div>
        </div>

        <div className={`text-right text-xl font-semibold ${tone.score}`}>
          {row.score}
        </div>
      </div>

      {mode === "combined" ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Trivia
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              {row.battleTriviaScore}
            </div>
          </div>

          <div className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Scramble
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              {row.wordScrambleScore}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileLeaderboardCard({ row, mode }) {
  const tone = getRankTone(row.rank);

  return (
    <div
      className={`rounded-[20px] border px-4 py-3 ${tone.shell} ${tone.glow}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${tone.badge}`}
            >
              #{row.rank}
            </span>

            {tone.icon ? (
              <span aria-hidden="true" className="text-sm">
                {tone.icon}
              </span>
            ) : null}
          </div>

          <div className="mt-2 truncate text-sm font-semibold text-white">
            {row.displayName || row.username}
          </div>

          <div className="mt-1 text-[11px] text-neutral-500">
            @{row.username}
          </div>
        </div>

        <div className="text-right">
          <div className={`text-base font-semibold ${tone.score}`}>
            {row.score}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
            points
          </div>
        </div>
      </div>

      {mode === "combined" ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Trivia
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              {row.battleTriviaScore}
            </div>
          </div>

          <div className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Scramble
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              {row.wordScrambleScore}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function LeaderboardsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const mode = searchParams.get("mode") || "combined";
  const period = searchParams.get("period") || "current";

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const result = await getLeaderboard(mode, period, 100);
        if (!isMounted) return;
        setData(result);
      } catch {
        if (!isMounted) return;
        setError("Failed to load leaderboard.");
        setData(null);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [mode, period]);

  const rows = useMemo(() => data?.rows || [], [data]);
  const podiumRows = useMemo(() => rows.slice(0, 3), [rows]);

  const subtitle = useMemo(() => {
    if (!data) return "";
    if (period === "previous" && data.endedAt) {
      return `Ended ${formatEndedAt(data.endedAt)}`;
    }
    return period === "current"
      ? "Live standings for this week"
      : "Latest completed week";
  }, [data, period]);

  const updateQuery = (nextMode, nextPeriod) => {
    setSearchParams({
      mode: nextMode,
      period: nextPeriod,
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-[76rem] px-4 py-6 pb-24 sm:px-5 sm:py-8 sm:pb-8 lg:px-6 lg:py-10">
        <AppSectionNav />

        <AppTopBar
          eyebrow="Leaderboards"
          title="Weekly standings"
          description="A cleaner ranking view for Battle Trivia, Word Scramble, and combined performance."
          showBackToLobby={false}
          actions={[]}
        />

        <div className="mb-5 rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.014))] p-4 sm:mb-6 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {MODES.map((item) => (
                <FilterPill
                  key={item.key}
                  active={mode === item.key}
                  onClick={() => updateQuery(item.key, period)}
                  accent="blue"
                >
                  {item.label}
                </FilterPill>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {PERIODS.map((item) => (
                <FilterPill
                  key={item.key}
                  active={period === item.key}
                  onClick={() => updateQuery(mode, item.key)}
                  accent="violet"
                >
                  {item.label}
                </FilterPill>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:mb-6 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
                {data?.label || getModeLabel(mode)}
              </div>
              <div className="mt-1 text-[15px] font-semibold tracking-[-0.03em] text-white sm:text-lg">
                {getPeriodLabel(period)}
              </div>
              <div className="mt-1 text-sm text-neutral-400">{subtitle}</div>
            </div>

            <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
              {rows.length} players
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SummaryStat label="Mode" value={getModeLabel(mode)} />
            <SummaryStat label="Period" value={getPeriodLabel(period)} />
            <SummaryStat
              label="Status"
              value={period === "current" ? "Live this week" : "Completed week"}
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-[18px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {error}
          </div>
        ) : isLoading ? (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-12 text-center text-sm text-neutral-500">
            Loading leaderboard...
          </div>
        ) : !rows.length ? (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-12 text-center text-sm text-neutral-500">
            No leaderboard data yet.
          </div>
        ) : (
          <>
            <section className="mb-5 sm:mb-6">
              <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
                Top players
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                {podiumRows.map((row) => (
                  <PodiumCard key={row.userId} row={row} mode={mode} />
                ))}
              </div>
            </section>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-3 sm:p-4">
              <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
                Full rankings
              </div>

              <div className="space-y-3 sm:hidden">
                {rows.map((row) => (
                  <MobileLeaderboardCard
                    key={row.userId}
                    row={row}
                    mode={mode}
                  />
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-[20px] border border-white/8 sm:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-black/20 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                      <tr>
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Player</th>
                        {mode === "combined" ? (
                          <>
                            <th className="px-4 py-3">Trivia</th>
                            <th className="px-4 py-3">Scramble</th>
                          </>
                        ) : null}
                        <th className="px-4 py-3">Score</th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((row) => {
                        const tone = getRankTone(row.rank);

                        return (
                          <tr
                            key={row.userId}
                            className={`border-t border-white/6 ${
                              row.rank <= 3 ? tone.shell : ""
                            }`}
                          >
                            <td className="px-4 py-3 text-sm font-semibold text-white">
                              #{row.rank}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-white">
                                {row.displayName || row.username}
                              </div>
                              <div className="text-[11px] text-neutral-500">
                                @{row.username}
                              </div>
                            </td>

                            {mode === "combined" ? (
                              <>
                                <td className="px-4 py-3 text-sm text-neutral-300">
                                  {row.battleTriviaScore}
                                </td>
                                <td className="px-4 py-3 text-sm text-neutral-300">
                                  {row.wordScrambleScore}
                                </td>
                              </>
                            ) : null}

                            <td className={`px-4 py-3 text-sm font-semibold ${tone.score}`}>
                              {row.score}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}