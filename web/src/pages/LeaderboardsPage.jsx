import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getLeaderboard } from "../api/leaderboardsApi";

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
      <div className="mx-auto w-full max-w-[76rem] px-4 py-6 sm:px-5 sm:py-8 lg:px-6 lg:py-10">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-[0.22em] text-blue-300/70">
            Leaderboards
          </div>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
            Weekly standings
          </h1>
          <p className="mt-3 text-sm leading-7 text-neutral-400 sm:text-[15px]">
            Switch between Battle Trivia, Word Scramble, and combined weekly standings.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {MODES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => updateQuery(item.key, period)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === item.key
                  ? "bg-blue-500 text-white"
                  : "border border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.05]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {PERIODS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => updateQuery(mode, item.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                period === item.key
                  ? "bg-violet-500 text-white"
                  : "border border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.05]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                {data?.label || "Leaderboard"}
              </div>
              <div className="mt-1 text-sm text-neutral-300">{subtitle}</div>
            </div>

            {data?.rows?.length ? (
              <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                {data.rows.length} players
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mt-4 rounded-[18px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
              {error}
            </div>
          ) : isLoading ? (
            <div className="mt-6 py-10 text-center text-sm text-neutral-500">
              Loading leaderboard...
            </div>
          ) : !data?.rows?.length ? (
            <div className="mt-6 py-10 text-center text-sm text-neutral-500">
              No leaderboard data yet.
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-[20px] border border-white/8">
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
                    {data.rows.map((row) => (
                      <tr key={row.userId} className="border-t border-white/6">
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
                        <td className="px-4 py-3 text-sm font-semibold text-blue-300">
                          {row.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}