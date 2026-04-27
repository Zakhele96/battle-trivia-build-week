import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getLeaderboard } from "../api/leaderboardsApi";
import { getActiveSponsor } from "../api/sponsorApi";
import SponsorSpotlightCard, {
  hasSponsorPlacement,
} from "../components/sponsor/SponsorSpotlightCard";
import { useTheme } from "../hooks/useTheme";
import { useSeo } from "../hooks/useSeo";

const MODE_META = {
  combined: {
    title: "The weekly race is on",
    description:
      "Battle Trivia and Word Scramble points combine into one leaderboard. Join now and start climbing.",
    accent: "from-sky-500/20 via-cyan-400/10 to-amber-400/10",
  },
  "battle-trivia": {
    title: "Battle Trivia is where the pressure lives",
    description:
      "Fast answers, live momentum, and a weekly board worth fighting for.",
    accent: "from-blue-500/20 via-sky-400/10 to-amber-400/12",
  },
  "word-scramble": {
    title: "Word Scramble is live this week",
    description:
      "Quick solves, sharp streaks, and a board that rewards consistency.",
    accent: "from-violet-500/18 via-fuchsia-400/10 to-emerald-400/12",
  },
};

function getModeLabel(mode) {
  if (mode === "battle-trivia") return "Battle Trivia";
  if (mode === "word-scramble") return "Word Scramble";
  return "Combined";
}

function getPeriodLabel(period) {
  return period === "previous" ? "Previous week" : "Current week";
}

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

function TopRowCard({ row, mode }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100">
            #{row.rank}
          </div>
          <div className="mt-3 text-lg font-semibold tracking-[-0.03em] text-white">
            {row.displayName || row.username}
          </div>
          <div className="mt-1 text-[12px] text-neutral-500">@{row.username}</div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-semibold text-blue-100">{row.score}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            points
          </div>
        </div>
      </div>

      {mode === "combined" ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Trivia
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              {row.battleTriviaScore} pts
            </div>
          </div>
          <div className="rounded-[16px] border border-white/8 bg-black/20 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Scramble
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              {row.wordScrambleScore} pts
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LeaderboardRow({ row, mode }) {
  return (
    <div className="grid grid-cols-[68px_minmax(0,1fr)_90px] items-center gap-3 rounded-[18px] border border-white/8 bg-black/20 px-3 py-3">
      <div className="text-sm font-semibold text-blue-100">#{row.rank}</div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-white">
          {row.displayName || row.username}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-neutral-500">
          @{row.username}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-white">{row.score}</div>
        <div className="text-[10px] text-neutral-500">
          {mode === "combined" ? "total" : "pts"}
        </div>
      </div>
    </div>
  );
}

export default function SharedLeaderboardPage() {
  const { resolvedTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "combined";
  const period = searchParams.get("period") || "current";

  const [data, setData] = useState(null);
  const [sponsor, setSponsor] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const [leaderboard, sponsorResult] = await Promise.all([
          getLeaderboard(mode, period, 12),
          period === "current"
            ? getActiveSponsor(mode).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (!isMounted) return;
        setData(leaderboard);
        setSponsor(sponsorResult);
      } catch {
        if (!isMounted) return;
        setError("Could not load this shared leaderboard right now.");
        setData(null);
        setSponsor(null);
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
  const topThree = useMemo(() => rows.slice(0, 3), [rows]);
  const meta = MODE_META[mode] || MODE_META.combined;
  const modeLabel = getModeLabel(mode);
  const periodLabel = getPeriodLabel(period);
  const isLight = resolvedTheme === "light";
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  useSeo({
    title: `${modeLabel} ${periodLabel} Leaderboard`,
    description: `${meta.description} View the ${periodLabel.toLowerCase()} BTS ${modeLabel} leaderboard and create your account to join the weekly race.`,
    canonicalPath: `/share/leaderboard?mode=${mode}&period=${period}`,
    keywords: [
      "BTS leaderboard",
      `${modeLabel} leaderboard`,
      `${periodLabel} leaderboard`,
      "weekly competition",
      "Battle Trivia leaderboard",
      "Word Scramble leaderboard",
    ],
    robots: "index,follow",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${modeLabel} ${periodLabel} Leaderboard`,
      description: `${meta.description} View the latest public BTS leaderboard.`,
      url: `https://www.brotechnodevs.co.za/share/leaderboard?mode=${mode}&period=${period}`,
      isPartOf: {
        "@type": "WebSite",
        name: "BTS",
        url: "https://www.brotechnodevs.co.za/",
      },
    },
  });

  return (
    <div
      className="min-h-screen bg-neutral-950 text-white"
      style={lightModeUndoFilter}
    >
      <div className="mx-auto max-w-[84rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-300">
            BTS
            <span className="text-neutral-500">Weekly competition</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/login"
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.07]"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
            >
              Create account
            </Link>
          </div>
        </div>

        <section
          className={`overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_28%),linear-gradient(135deg,rgba(10,10,11,1)_0%,rgba(17,24,39,0.96)_50%,rgba(10,10,11,1)_100%)]`}
        >
          <div className="grid gap-8 px-5 py-6 sm:px-7 sm:py-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-10">
            <div>
              <div className="inline-flex rounded-full border border-blue-300/18 bg-blue-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                {getModeLabel(mode)} · {getPeriodLabel(period)}
              </div>
              <h1 className="mt-4 max-w-[12ch] text-[38px] font-semibold leading-none tracking-[-0.05em] text-white sm:text-[54px]">
                {meta.title}
              </h1>
              <p className="mt-4 max-w-[42rem] text-[15px] leading-7 text-neutral-300 sm:text-[17px]">
                {meta.description} This page is built for one thing: making you
                want in.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Board
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {data?.label || getModeLabel(mode)}
                  </div>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Players shown
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {rows.length}
                  </div>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Status
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {period === "current"
                      ? "Live now"
                      : data?.endedAt
                      ? `Ended ${formatEndedAt(data.endedAt)}`
                      : "Completed"}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
                >
                  Join and start climbing
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.07]"
                >
                  I already play
                </Link>
              </div>
            </div>

            <div className={`rounded-[28px] border border-white/10 bg-gradient-to-br ${meta.accent} p-4 sm:p-5`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Live spotlight
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    Who is setting the pace?
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                  Weekly board
                </div>
              </div>

              {isLoading ? (
                <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-12 text-center text-sm text-neutral-500">
                  Loading shared leaderboard...
                </div>
              ) : error ? (
                <div className="rounded-[22px] border border-red-900/35 bg-red-950/25 px-4 py-4 text-sm text-red-300/90">
                  {error}
                </div>
              ) : topThree.length > 0 ? (
                <div className="space-y-3">
                  {topThree.map((row) => (
                    <TopRowCard key={row.userId} row={row} mode={mode} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-12 text-center text-sm text-neutral-500">
                  No public leaderboard rows yet.
                </div>
              )}
            </div>
          </div>
        </section>

        {period === "current" &&
        hasSponsorPlacement(sponsor, "leaderboard-header") ? (
          <div className="mt-5">
            <SponsorSpotlightCard sponsor={sponsor} />
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Why people join
            </div>
            <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white">
              Shared bragging rights, real weekly pressure
            </h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                <div className="text-sm font-semibold text-white">
                  Live weekly competition
                </div>
                <div className="mt-1 text-[13px] leading-6 text-neutral-400">
                  Jump in while the board is moving and make your first points count immediately.
                </div>
              </div>
              <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                <div className="text-sm font-semibold text-white">
                  Different ways to win
                </div>
                <div className="mt-1 text-[13px] leading-6 text-neutral-400">
                  Battle Trivia rewards sharp answers. Word Scramble rewards speed and consistency.
                </div>
              </div>
              <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                <div className="text-sm font-semibold text-white">
                  Easy first step
                </div>
                <div className="mt-1 text-[13px] leading-6 text-neutral-400">
                  Create an account, enter the room, and start building your name on the board.
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Shared standings
                </div>
                <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white">
                  The board new players see first
                </h2>
              </div>
              <Link
                to="/register"
                className="rounded-full border border-blue-300/18 bg-blue-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100 transition hover:bg-blue-500/15"
              >
                Claim your spot
              </Link>
            </div>

            <div className="mt-5 space-y-2.5">
              {rows.map((row) => (
                <LeaderboardRow
                  key={row.userId || `${row.username}-${row.rank}`}
                  row={row}
                  mode={mode}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
