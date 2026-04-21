import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getLeaderboard } from "../api/leaderboardsApi";
import AppTopBar from "../components/layout/AppTopBar";
import AppSectionNav from "../components/layout/AppSectionNav";
import { useAuth } from "../hooks/useAuth";

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
      shell: "border-amber-300/20 bg-amber-400/10",
      badge: "bg-amber-400/15 text-amber-100",
      score: "text-amber-100",
      accent: "border-amber-300/18",
      label: "1st",
    };
  }

  if (rank === 2) {
    return {
      shell: "border-slate-300/15 bg-slate-300/10",
      badge: "bg-slate-300/15 text-slate-100",
      score: "text-slate-100",
      accent: "border-slate-300/16",
      label: "2nd",
    };
  }

  if (rank === 3) {
    return {
      shell: "border-orange-300/18 bg-orange-400/10",
      badge: "bg-orange-400/15 text-orange-100",
      score: "text-orange-100",
      accent: "border-orange-300/16",
      label: "3rd",
    };
  }

  return {
    shell: "border-white/8 bg-white/[0.03]",
    badge: "bg-white/[0.05] text-neutral-300",
    score: "text-blue-200",
    accent: "border-white/8",
    label: `${rank}th`,
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

function SummaryStat({ label, value, detail }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
      {detail ? (
        <div className="mt-1 text-[11px] leading-5 text-neutral-400">
          {detail}
        </div>
      ) : null}
    </div>
  );
}

function PodiumCard({ row, mode }) {
  const tone = getRankTone(row.rank);

  return (
    <div
      className={`rounded-[22px] border p-4 shadow-[0_18px_36px_rgba(0,0,0,0.14)] ${tone.shell}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${tone.badge}`}
          >
            {tone.label}
          </span>

          <div className="mt-3 truncate text-base font-semibold text-white">
            {row.displayName || row.username}
          </div>

          <div className="mt-1 text-[11px] text-neutral-500">
            @{row.username}
          </div>
        </div>

        <div className="text-right">
          <div className={`text-2xl font-semibold ${tone.score}`}>
            {row.score}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            total
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {mode === "combined" ? (
          <>
            <SummaryStat
              label="Trivia"
              value={row.battleTriviaScore}
              detail="Battle Trivia points"
            />
            <SummaryStat
              label="Scramble"
              value={row.wordScrambleScore}
              detail="Word Scramble points"
            />
          </>
        ) : (
          <SummaryStat
            label="Weekly score"
            value={`${row.score} pts`}
            detail={`Current position: #${row.rank}`}
          />
        )}
      </div>
    </div>
  );
}

function MobileLeaderboardCard({
  row,
  mode,
  leaderScore,
  isCurrentUser = false,
}) {
  const tone = getRankTone(row.rank);
  const gap = Math.max(0, (leaderScore || 0) - (row.score || 0));

  return (
    <div
      className={`rounded-[20px] border p-4 shadow-[0_14px_28px_rgba(0,0,0,0.12)] ${
        isCurrentUser
          ? "border-blue-300/25 bg-blue-500/10"
          : `${tone.shell} ${tone.accent}`
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
                isCurrentUser ? "bg-blue-400/15 text-blue-100" : tone.badge
              }`}
            >
              #{row.rank}
            </span>

            <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              {row.rank <= 3 ? `${tone.label} place` : "Leaderboard position"}
            </span>

            {isCurrentUser ? (
              <span className="rounded-full border border-blue-300/18 bg-blue-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-blue-100">
                You
              </span>
            ) : null}
          </div>

          <div className="mt-3 text-base font-semibold text-white">
            {row.displayName || row.username}
          </div>

          <div className="mt-1 text-[12px] text-neutral-400">
            @{row.username}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div
            className={`text-2xl font-semibold ${
              isCurrentUser ? "text-blue-100" : tone.score
            }`}
          >
            {row.score}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            points
          </div>
        </div>
      </div>

      {mode === "combined" ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <SummaryStat
            label="Trivia"
            value={row.battleTriviaScore}
            detail="Battle Trivia"
          />
          <SummaryStat
            label="Scramble"
            value={row.wordScrambleScore}
            detail="Word Scramble"
          />
        </div>
      ) : null}

      <div className="mt-4 rounded-[16px] border border-white/8 bg-black/20 px-3 py-2.5 text-[12px] leading-5 text-neutral-300">
        {row.rank === 1
          ? "Currently leading this board."
          : `${gap} point${gap === 1 ? "" : "s"} behind the leader.`}
      </div>
    </div>
  );
}

export default function LeaderboardsPage() {
  const { user } = useAuth();
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
        if (isMounted) {
          setData(result);
        }
      } catch {
        if (isMounted) {
          setError("Failed to load leaderboard.");
          setData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [mode, period]);

  const rows = useMemo(() => data?.rows || [], [data]);
  const podiumRows = useMemo(() => rows.slice(0, 3), [rows]);
  const leader = rows[0] || null;
  const leaderScore = leader?.score || 0;

  const subtitle = useMemo(() => {
    if (!data) return "";
    if (period === "previous" && data.endedAt) {
      return `Ended ${formatEndedAt(data.endedAt)}`;
    }
    return period === "current"
      ? "Live standings for this week"
      : "Latest completed week";
  }, [data, period]);

  const currentStanding = useMemo(() => {
    if (!user?.id) return null;
    return rows.find((row) => row.userId === user.id) || null;
  }, [rows, user?.id]);

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
          description="A clearer ranking view for Battle Trivia, Word Scramble, and combined performance."
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
              {rows.length} players shown
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SummaryStat
              label="Leader"
              value={leader ? `#1 ${leader.displayName || leader.username}` : "Waiting for scores"}
              detail={leader ? `${leader.score} total points` : "No leaderboard data yet"}
            />
            <SummaryStat
              label="Your place"
              value={currentStanding ? `#${currentStanding.rank}` : "Not ranked"}
              detail={
                currentStanding
                  ? `${currentStanding.score} total points so far`
                  : "Play more this week to appear here"
              }
            />
            <SummaryStat
              label="Status"
              value={period === "current" ? "Live this week" : "Completed week"}
              detail={
                period === "current"
                  ? "Scores can still move"
                  : "Standings are locked"
              }
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
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
                  Podium
                </div>
                <div className="text-[11px] text-neutral-500">
                  Top three right now
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                {podiumRows.map((row) => (
                  <PodiumCard key={row.userId} row={row} mode={mode} />
                ))}
              </div>
            </section>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
                    Full rankings
                  </div>
                  <div className="mt-1 text-[12px] leading-5 text-neutral-400 sm:text-[13px]">
                    Mobile cards explain position, score, and leader gap without making you read a dense table.
                  </div>
                </div>

                {currentStanding ? (
                  <div className="rounded-full border border-blue-300/18 bg-blue-400/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-blue-100">
                    You are #{currentStanding.rank}
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 sm:hidden">
                {rows.map((row) => (
                  <MobileLeaderboardCard
                    key={row.userId}
                    row={row}
                    mode={mode}
                    leaderScore={leaderScore}
                    isCurrentUser={row.userId === user?.id}
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
                        const isCurrentUser = row.userId === user?.id;

                        return (
                          <tr
                            key={row.userId}
                            className={`border-t border-white/6 ${
                              isCurrentUser
                                ? "bg-blue-500/10"
                                : row.rank <= 3
                                ? tone.shell
                                : ""
                            }`}
                          >
                            <td className="px-4 py-3 text-sm font-semibold text-white">
                              #{row.rank}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-white">
                                  {row.displayName || row.username}
                                </div>
                                {isCurrentUser ? (
                                  <span className="rounded-full border border-blue-300/18 bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-blue-100">
                                    You
                                  </span>
                                ) : null}
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
