import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createChallengeInvite } from "../api/challengeInvitesApi";
import { getFriendsLeaderboard, getHeadToHead } from "../api/friendsApi";
import { getLeaderboard } from "../api/leaderboardsApi";
import AppTopBar from "../components/layout/AppTopBar";
import AppSectionNav from "../components/layout/AppSectionNav";
import { getActiveSponsor } from "../api/sponsorApi";
import SponsorSpotlightCard, {
  hasSponsorPlacement,
} from "../components/sponsor/SponsorSpotlightCard";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import {
  buildRivalryCardSvg,
  buildShareText,
  buildShareUrl,
  buildTopThreeCardSvg,
  downloadGeneratedCardPng,
  downloadShareCardPng,
  getModeLabel,
  getPeriodLabel,
} from "../services/leaderboardShare";

const MODES = [
  { key: "combined", label: "Combined" },
  { key: "battle-trivia", label: "Battle Trivia" },
  { key: "word-scramble", label: "Word Scramble" },
];

const PERIODS = [
  { key: "current", label: "Current week" },
  { key: "previous", label: "Previous week" },
];

const SCOPES = [
  { key: "all", label: "Global" },
  { key: "friends", label: "Friends" },
];
const PAGE_SIZE = 10;

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

function ModeOption({ item, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[18px] border p-3 text-left transition sm:p-4 ${
        active
          ? "border-blue-300/22 bg-blue-500/12 shadow-[0_14px_28px_rgba(37,99,235,0.12)]"
          : "border-white/10 bg-black/20 hover:border-white/16 hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-5 text-white sm:text-[14px]">
            {item.label}
          </div>
          <div className="mt-1 text-[11px] leading-4 text-neutral-400 sm:leading-5">
            {item.description}
          </div>
        </div>

        <div
          className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border ${
            active
              ? "border-blue-300/30 bg-blue-400/18"
              : "border-white/12 bg-white/[0.03]"
          }`}
        >
          <div
            className={`m-auto mt-[3px] h-2.5 w-2.5 rounded-full ${
              active ? "bg-blue-200" : "bg-transparent"
            }`}
          />
        </div>
      </div>
    </button>
  );
}

function CompactModeSwitcher({ value, onChange }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.038),rgba(255,255,255,0.018))] p-1 sm:hidden">
      <div className="grid grid-cols-3 gap-1">
        {MODES.map((item) => {
          const active = value === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`rounded-[14px] px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                active
                  ? "bg-blue-500 text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)]"
                  : "text-neutral-300"
              }`}
            >
              {item.key === "battle-trivia"
                ? "Trivia"
                : item.key === "word-scramble"
                  ? "Scramble"
                  : "Combined"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PeriodSwitcher({ value, onChange }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-black/20 p-1">
      <div className="grid grid-cols-2 gap-1">
        {PERIODS.map((item) => {
          const active = value === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`rounded-[14px] px-3 py-2.5 text-[12px] font-medium transition sm:py-2 sm:text-sm ${
                active
                  ? "bg-violet-500 text-white shadow-[0_12px_24px_rgba(139,92,246,0.22)]"
                  : "text-neutral-300 hover:bg-white/[0.04]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScopeSwitcher({ value, onChange }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-black/20 p-1">
      <div className="grid grid-cols-2 gap-1">
        {SCOPES.map((item) => {
          const active = value === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`rounded-[14px] px-3 py-2.5 text-[12px] font-medium transition sm:py-2 sm:text-sm ${
                active
                  ? "bg-emerald-500 text-white shadow-[0_12px_24px_rgba(16,185,129,0.22)]"
                  : "text-neutral-300 hover:bg-white/[0.04]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SummaryStat({ label, value, detail, compact = false }) {
  return (
    <div
      className={`rounded-[18px] border border-white/8 bg-black/20 ${
        compact ? "px-3 py-2.5" : "px-3.5 py-3 sm:px-4"
      }`}
    >
      <div
        className={`uppercase tracking-[0.14em] text-neutral-500 ${
          compact ? "text-[9px]" : "text-[10px]"
        }`}
      >
        {label}
      </div>
      <div className={`mt-1 font-semibold text-white ${compact ? "text-[13px]" : "text-sm"}`}>
        {value}
      </div>
      {detail ? (
        <div
          className={`mt-1 text-neutral-400 ${compact ? "text-[10px] leading-4" : "text-[11px] leading-5"}`}
        >
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
      className={`rounded-[16px] border p-3 shadow-[0_10px_22px_rgba(0,0,0,0.1)] sm:rounded-[22px] sm:p-4 sm:shadow-[0_18px_36px_rgba(0,0,0,0.14)] ${tone.shell}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${tone.badge}`}
          >
            {tone.label}
          </span>

          <div className="mt-2 truncate text-[14px] font-semibold text-white sm:mt-3 sm:text-base">
            {row.displayName || row.username}
          </div>

          <div className="mt-1 text-[11px] text-neutral-500">
            @{row.username}
          </div>
        </div>

        <div className="text-right">
          <div className={`text-xl font-semibold sm:text-2xl ${tone.score}`}>
            {row.score}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            total
          </div>
        </div>
      </div>

      <div className="mt-2.5 grid gap-2 sm:mt-4 sm:grid-cols-2">
        {mode === "combined" ? (
          <>
            <SummaryStat
              compact
              label="Trivia"
              value={row.battleTriviaScore}
              detail="Battle Trivia points"
            />
            <SummaryStat
              compact
              label="Scramble"
              value={row.wordScrambleScore}
              detail="Word Scramble points"
            />
          </>
        ) : (
          <SummaryStat
            compact
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
  onShare,
  onDownload,
  onCompare,
  onChallenge,
}) {
  const tone = getRankTone(row.rank);
  const gap = Math.max(0, (leaderScore || 0) - (row.score || 0));

  return (
    <div
      className={`rounded-[18px] border p-3.5 shadow-[0_10px_22px_rgba(0,0,0,0.12)] ${
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

          <div className="mt-2 text-[15px] font-semibold leading-5 text-white">
            {row.displayName || row.username}
          </div>

          <div className="mt-1 truncate text-[12px] text-neutral-400">
            @{row.username}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div
            className={`text-xl font-semibold ${
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
        <div className="mt-3 grid grid-cols-2 gap-2">
          <SummaryStat
            compact
            label="Trivia"
            value={row.battleTriviaScore}
            detail="Battle Trivia"
          />
          <SummaryStat
            compact
            label="Scramble"
            value={row.wordScrambleScore}
            detail="Word Scramble"
          />
        </div>
      ) : null}

      <div className="mt-3 rounded-[14px] border border-white/8 bg-black/20 px-3 py-2.5 text-[11px] leading-4 text-neutral-300">
        {row.rank === 1
          ? "Currently leading this board."
          : `${gap} point${gap === 1 ? "" : "s"} behind the leader.`}
      </div>

      {isCurrentUser ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onShare?.(row)}
            className="rounded-[14px] border border-blue-300/18 bg-blue-400/10 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100 transition hover:bg-blue-400/15"
          >
            Share your rank
          </button>
          <button
            type="button"
            onClick={() => onDownload?.(row)}
            className="rounded-[14px] border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.07]"
          >
            Download story card
          </button>
        </div>
      ) : onCompare || onChallenge ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {onCompare ? (
            <button
              type="button"
              onClick={() => onCompare?.(row)}
              className="rounded-[14px] border border-violet-300/18 bg-violet-400/10 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-100 transition hover:bg-violet-400/15"
            >
              Compare
            </button>
          ) : null}
          {onChallenge ? (
            <button
              type="button"
              onClick={() => onChallenge?.(row)}
              className="rounded-[14px] border border-orange-300/18 bg-orange-400/10 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-100 transition hover:bg-orange-400/15"
            >
              Challenge
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RivalryPanel({
  currentStanding,
  selectedRival,
  headToHead,
  isLoadingHeadToHead,
  onDownload,
  onClear,
  isCompact = false,
}) {
  if (!currentStanding || !selectedRival) return null;

  const youName = currentStanding.displayName || currentStanding.username;
  const rivalName = selectedRival.displayName || selectedRival.username;

  return (
    <div
      className={`rounded-[18px] border border-violet-300/18 bg-violet-500/10 ${
        isCompact ? "px-3.5 py-3" : "px-4 py-3"
      }`}
    >
      <div
        className={
          isCompact
            ? "space-y-3"
            : "flex flex-wrap items-center justify-between gap-3"
        }
      >
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.16em] text-violet-100/75">
            Compare players
          </div>
          <div className="mt-1 text-sm text-white">
            {youName} vs {rivalName}
          </div>
          <div className="mt-1 text-[12px] leading-5 text-violet-100/80">
            You are #{currentStanding.rank} with {currentStanding.score} points.
            {` `}
            {rivalName} is #{selectedRival.rank} with {selectedRival.score} points.
          </div>
          {isLoadingHeadToHead ? (
            <div className="mt-2 text-[12px] text-violet-100/75">
              Loading comparison...
            </div>
          ) : headToHead ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <SummaryStat
                label="All matches"
                value={`${headToHead.overall.wins} wins`}
                detail={`${headToHead.overall.losses} losses, ${headToHead.overall.ties} ties`}
              />
              <SummaryStat
                label="Battle Trivia"
                value={`${headToHead.battleTrivia.wins} wins`}
                detail={`${headToHead.battleTrivia.losses} losses, ${headToHead.battleTrivia.ties} ties`}
              />
              <SummaryStat
                label="Word Scramble"
                value={`${headToHead.wordScramble.wins} wins`}
                detail={`${headToHead.wordScramble.losses} losses, ${headToHead.wordScramble.ties} ties`}
              />
            </div>
          ) : null}
          {headToHead?.currentBoardEdge ? (
            <div className="mt-2 text-[12px] leading-5 text-violet-100/80">
              {headToHead.currentBoardEdge}
            </div>
          ) : null}
          {headToHead?.previousBoardEdge ? (
            <div className="mt-1 text-[12px] leading-5 text-violet-100/80">
              {headToHead.previousBoardEdge}
            </div>
          ) : null}
        </div>

        <div
          className={
            isCompact ? "grid grid-cols-1 gap-2" : "flex flex-wrap gap-2"
          }
        >
          <button
            type="button"
            onClick={onDownload}
            className={`border border-violet-200/20 bg-white/10 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-100 transition hover:bg-white/15 ${
              isCompact
                ? "w-full rounded-[14px] px-3 py-3"
                : "rounded-full px-3 py-1.5"
            }`}
          >
            Download card
          </button>
          <button
            type="button"
            onClick={onClear}
            className={`border border-white/12 bg-white/[0.04] text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08] ${
              isCompact
                ? "w-full rounded-[14px] px-3 py-3"
                : "rounded-full px-3 py-1.5"
            }`}
          >
            {isCompact ? "Close" : "Clear"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardsPage() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedMode = searchParams.get("mode");
  const requestedPeriod = searchParams.get("period");
  const requestedScope = searchParams.get("scope");

  const mode = MODES.some((item) => item.key === requestedMode)
    ? requestedMode
    : "battle-trivia";
  const period = PERIODS.some((item) => item.key === requestedPeriod)
    ? requestedPeriod
    : "current";
  const scope = SCOPES.some((item) => item.key === requestedScope)
    ? requestedScope
    : "all";

  useEffect(() => {
    const needsMode = requestedMode !== mode;
    const needsPeriod = requestedPeriod !== period;
    const needsScope = requestedScope !== scope;

    if (!needsMode && !needsPeriod && !needsScope) {
      return;
    }

    setSearchParams({
      mode,
      period,
      scope,
    });
  }, [
    mode,
    period,
    requestedMode,
    requestedPeriod,
    requestedScope,
    scope,
    setSearchParams,
  ]);

  const [data, setData] = useState(null);
  const [sponsor, setSponsor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [selectedRivalUserId, setSelectedRivalUserId] = useState("");
  const [headToHead, setHeadToHead] = useState(null);
  const [isLoadingHeadToHead, setIsLoadingHeadToHead] = useState(false);
  const [isMobileRivalryOpen, setIsMobileRivalryOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const [result, sponsorResult] = await Promise.all([
          scope === "friends"
            ? getFriendsLeaderboard(mode, period)
            : getLeaderboard(mode, period, 100),
          period === "current"
            ? getActiveSponsor(mode).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (isMounted) {
          setData(result);
          setSponsor(sponsorResult);
        }
      } catch {
        if (isMounted) {
          setError("Failed to load leaderboard.");
          setData(null);
          setSponsor(null);
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
  }, [mode, period, scope]);

  useEffect(() => {
    setPage(1);
  }, [mode, period, scope]);

  useEffect(() => {
    setIsMobileRivalryOpen(false);
  }, [mode, period, scope, page]);

  const rows = useMemo(() => data?.rows || [], [data]);
  const podiumRows = useMemo(() => rows.slice(0, 3), [rows]);
  const leader = rows[0] || null;
  const leaderScore = leader?.score || 0;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [page, rows]);

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
  const selectedRival = useMemo(() => {
    if (!selectedRivalUserId) return null;
    return rows.find((row) => row.userId === selectedRivalUserId) || null;
  }, [rows, selectedRivalUserId]);

  const updateQuery = (nextMode, nextPeriod) => {
    setSearchParams({
      mode: nextMode,
      period: nextPeriod,
      scope,
    });
  };

  const handleShareRank = async (row) => {
    if (!row) return;

    const url = buildShareUrl(mode, period, row.userId);
    const text = buildShareText({
      row,
      mode,
      period,
      label: data?.label,
    });

    try {
      if (navigator.share) {
        await navigator.share({
          title: "BTS Leaderboard",
          text,
          url,
        });
        setShareMessage("Share sheet opened.");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShareMessage("Share text copied.");
    } catch {
      setShareMessage("Could not share right now.");
    }
  };

  const handleDownloadRankCard = async (row) => {
    if (!row) return;

    const playerName = row.displayName || row.username || "player";

    try {
      await downloadShareCardPng({
        mode,
        period,
        userId: row.userId,
        filenameBase: `${playerName}-${mode}-${period}-rank-card`,
      });
      setShareMessage("Story card downloaded.");
    } catch {
      setShareMessage("Could not download story card right now.");
    }
  };

  const handleChallengePlayer = async (row) => {
    if (!row || !currentStanding || !user?.id || row.userId === user.id) return;

    try {
      await createChallengeInvite({
        rivalUserId: row.userId,
        mode,
        period,
      });
      setShareMessage(
        `${row.displayName || row.username || "Player"} got your challenge in their inbox.`
      );
    } catch {
      setShareMessage("Could not send challenge right now.");
    }
  };

  const handleComparePlayer = async (row) => {
    if (!row || row.userId === user?.id) return;
    setSelectedRivalUserId(row.userId);
    setIsMobileRivalryOpen(true);
    setIsLoadingHeadToHead(true);

    try {
      const summary = await getHeadToHead(row.userId);
      setHeadToHead(summary);
      setShareMessage(
        `${row.displayName || row.username || "That player"} is now loaded into your rivalry card.`
      );
    } catch (err) {
      setHeadToHead(null);
      setShareMessage(
        err?.response?.data?.message || "Head-to-head works once that player is in your friend circle."
      );
    } finally {
      setIsLoadingHeadToHead(false);
    }
  };

  const handleDownloadTopThreeCard = async () => {
    if (!podiumRows.length) return;

    try {
      await downloadGeneratedCardPng(
        buildTopThreeCardSvg({
          rows: podiumRows,
          label: data?.label || getModeLabel(mode),
          period,
        }),
        `${mode}-${period}-top-three-card`
      );
      setShareMessage("Top 3 card downloaded.");
    } catch {
      setShareMessage("Could not download the Top 3 card right now.");
    }
  };

  const handleDownloadRivalryCard = async () => {
    if (!currentStanding || !selectedRival) return;

    try {
      await downloadGeneratedCardPng(
        buildRivalryCardSvg({
          challenger: currentStanding,
          rival: selectedRival,
          label: data?.label || getModeLabel(mode),
          period,
        }),
        `${currentStanding.displayName || currentStanding.username || "player"}-${selectedRival.displayName || selectedRival.username || "rival"}-rivalry-card`
      );
      setShareMessage("Rivalry card downloaded.");
    } catch {
      setShareMessage("Could not download the rivalry card right now.");
    }
  };

  const clearRivalry = () => {
    setSelectedRivalUserId("");
    setHeadToHead(null);
    setIsMobileRivalryOpen(false);
  };

  const isLight = resolvedTheme === "light";
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  return (
    <div
      className={`leaderboards-page min-h-screen bg-neutral-950 text-white ${
        isLight ? "leaderboards-page--light" : ""
      }`}
      style={lightModeUndoFilter}
    >
      <div className="mx-auto w-full max-w-[76rem] px-4 py-6 pb-24 sm:px-5 sm:py-8 sm:pb-8 lg:px-6 lg:py-10">
        <AppSectionNav />

        <AppTopBar
          eyebrow="Leaderboards"
          title="Weekly standings"
          description="Track the board, spot your gap, and move faster between the rankings that matter."
          actions={[]}
        />

        {period === "current" &&
        hasSponsorPlacement(sponsor, "leaderboard-header") ? (
          <div className="mb-5 sm:mb-6">
            <SponsorSpotlightCard sponsor={sponsor} />
          </div>
        ) : null}

        <div className="mb-5 rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.014))] p-3.5 sm:mb-6 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Choose a board
              </div>
              <CompactModeSwitcher
                value={mode}
                onChange={(nextMode) => updateQuery(nextMode, period)}
              />
              <div className="hidden gap-2.5 sm:grid sm:grid-cols-3">
                {MODES.map((item) => (
                  <ModeOption
                    key={item.key}
                    item={{
                      ...item,
                      description:
                        item.key === "combined"
                          ? "One ranking across both games."
                          : item.key === "battle-trivia"
                          ? "Battle Trivia only."
                          : "Word Scramble only.",
                    }}
                    active={mode === item.key}
                    onClick={() => updateQuery(item.key, period)}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Time window
              </div>
              <PeriodSwitcher
                value={period}
                onChange={(nextPeriod) => updateQuery(mode, nextPeriod)}
              />

              <div className="mt-3 rounded-[18px] border border-white/8 bg-black/20 px-3.5 py-3 sm:px-4">
                <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                  Current selection
                </div>
                <div className="mt-1 text-[15px] font-semibold text-white sm:text-sm">
                  {getModeLabel(mode)} · {getPeriodLabel(period)}
                </div>
                <div className="mt-1 text-[12px] leading-5 text-neutral-400">
                  {period === "current"
                    ? "Live scores that can still move this week."
                    : "The most recent finished week with locked results."}
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Scope
                </div>
                <ScopeSwitcher
                  value={scope}
                  onChange={(nextScope) =>
                    setSearchParams({ mode, period, scope: nextScope })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-3.5 sm:mb-6 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
                {data?.label || getModeLabel(mode)}
              </div>
              <div className="mt-1 text-[17px] font-semibold tracking-[-0.03em] text-white sm:text-lg">
                {getPeriodLabel(period)}
              </div>
              <div className="mt-1 text-[13px] leading-5 text-neutral-400 sm:text-sm">
                {subtitle}
              </div>
            </div>

            <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
              {rows.length} players shown
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-3 sm:gap-3">
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

          {rows.length > PAGE_SIZE ? (
            <div className="mt-4 rounded-[18px] border border-white/8 bg-black/20 px-3.5 py-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-4">
              <div className="text-[12px] text-neutral-400">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, rows.length)}-
                {Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 sm:mt-0 sm:justify-end">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Previous
                </button>
                <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                  Page {page} of {totalPages}
                </div>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((previous) => Math.min(totalPages, previous + 1))
                  }
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {currentStanding ? (
            <div className="mt-4 rounded-[18px] border border-blue-300/18 bg-blue-400/10 px-3.5 py-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-4">
              <div className="text-[13px] leading-5 text-blue-100 sm:text-sm">
                Share your current rank: #{currentStanding.rank} with{" "}
                {currentStanding.score} pts.
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-0 sm:flex sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={() => handleDownloadRankCard(currentStanding)}
                  className="rounded-[14px] border border-white/12 bg-white/[0.04] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08] sm:rounded-full sm:py-1.5"
                >
                  Download story card
                </button>
                <button
                  type="button"
                  onClick={() => handleShareRank(currentStanding)}
                  className="rounded-[14px] border border-blue-200/20 bg-white/10 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100 transition hover:bg-white/15 sm:rounded-full sm:py-1.5"
                >
                  Share rank
                </button>
              </div>
            </div>
          ) : null}

          {shareMessage ? (
            <div className="mt-3 text-[12px] text-neutral-400">{shareMessage}</div>
          ) : null}
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
            <section className="mb-5 hidden sm:block sm:mb-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
                  Podium
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden text-[11px] text-neutral-500 sm:block">
                    Top three right now
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTopThreeCard}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08]"
                  >
                    Download top 3
                  </button>
                </div>
              </div>

              <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-3">
                {podiumRows.map((row) => (
                  <PodiumCard key={row.userId} row={row} mode={mode} />
                ))}
              </div>

              {period === "current" &&
              hasSponsorPlacement(sponsor, "leaderboard-podium") ? (
                <div className="mt-3">
                  <SponsorSpotlightCard sponsor={sponsor} compact />
                </div>
              ) : null}
            </section>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
                    Full rankings
                  </div>
                  <div className="mt-1 text-[12px] leading-5 text-neutral-400 sm:text-[13px]">
                    Mobile cards keep your place, score, and next move easy to scan without a dense table.
                  </div>
                </div>

                {currentStanding ? (
                  <div className="rounded-full border border-blue-300/18 bg-blue-400/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-blue-100">
                    You are #{currentStanding.rank}
                  </div>
                ) : null}
              </div>

              {currentStanding && selectedRival ? (
                <div className="mb-3 hidden sm:block">
                  <RivalryPanel
                    currentStanding={currentStanding}
                    selectedRival={selectedRival}
                    headToHead={headToHead}
                    isLoadingHeadToHead={isLoadingHeadToHead}
                    onDownload={handleDownloadRivalryCard}
                    onClear={clearRivalry}
                  />
                </div>
              ) : null}

              <div className="space-y-3 sm:hidden">
                {pagedRows.map((row) => (
                  <MobileLeaderboardCard
                    key={row.userId}
                    row={row}
                    mode={mode}
                    leaderScore={leaderScore}
                    isCurrentUser={row.userId === user?.id}
                    onShare={handleShareRank}
                    onDownload={handleDownloadRankCard}
                    onCompare={currentStanding ? handleComparePlayer : null}
                    onChallenge={currentStanding ? handleChallengePlayer : null}
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
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pagedRows.map((row) => {
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
                            <td className="px-4 py-3">
                              {isCurrentUser ? (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleShareRank(row)}
                                    className="rounded-full border border-blue-300/18 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100 transition hover:bg-blue-400/15"
                                  >
                                    Share
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadRankCard(row)}
                                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08]"
                                  >
                                    Download
                                  </button>
                                </div>
                              ) : currentStanding ? (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleComparePlayer(row)}
                                    className="rounded-full border border-violet-300/18 bg-violet-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-100 transition hover:bg-violet-400/15"
                                  >
                                    Compare
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleChallengePlayer(row)}
                                    className="rounded-full border border-orange-300/18 bg-orange-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-100 transition hover:bg-orange-400/15"
                                  >
                                    Challenge
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-neutral-500">-</span>
                              )}
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

        {currentStanding && selectedRival && isMobileRivalryOpen ? (
          <div className="fixed inset-0 z-[70] sm:hidden">
            <button
              type="button"
              aria-label="Close compare popup"
              className="absolute inset-0 bg-black/72"
              onClick={clearRivalry}
            />

            <div className="absolute inset-x-0 bottom-0 z-10 rounded-t-[28px] border border-violet-300/20 bg-neutral-950 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_80px_rgba(0,0,0,0.48)]">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/12" />

              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-violet-100/75">
                    Compare
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    Head-to-head summary
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearRivalry}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[72vh] overflow-y-auto overscroll-contain pb-1">
                <RivalryPanel
                  currentStanding={currentStanding}
                  selectedRival={selectedRival}
                  headToHead={headToHead}
                  isLoadingHeadToHead={isLoadingHeadToHead}
                  onDownload={handleDownloadRivalryCard}
                  onClear={clearRivalry}
                  isCompact
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
