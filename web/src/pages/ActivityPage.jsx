import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyProfile,
  getMyProfileHistory,
  getMyProgression,
} from "../api/profileApi";
import AppTopBar from "../components/layout/AppTopBar";
import AppSectionNav from "../components/layout/AppSectionNav";
import ProfileAchievementsCard from "../components/profile/ProfileAchievementsCard";
import ProfileProgressCard from "../components/profile/ProfileProgressCard";
import { useTheme } from "../hooks/useTheme";

function formatFastest(ms) {
  if (typeof ms !== "number") return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 10000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2.5 sm:mb-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
          {eyebrow}
        </div>
        <div className="mt-1 text-[16px] font-semibold tracking-[-0.03em] text-white sm:text-[19px]">
          {title}
        </div>
        {description ? (
          <div className="mt-1 text-[12px] leading-5 text-neutral-400 sm:mt-1.5 sm:text-[13px]">
            {description}
          </div>
        ) : null}
      </div>

      {action ? action : null}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] px-3.5 py-3 sm:rounded-[20px] sm:px-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-white sm:text-lg">
        {value}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, detail, accent = "blue" }) {
  const accentClassName =
    accent === "violet"
      ? "border-violet-300/18 bg-violet-500/10 text-violet-200"
      : accent === "emerald"
        ? "border-emerald-300/18 bg-emerald-400/10 text-emerald-200"
        : "border-blue-300/18 bg-blue-400/10 text-blue-200";

  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] sm:rounded-[20px] sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">{label}</div>
        <div className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${accentClassName}`}>
          Live
        </div>
      </div>
      <div className="mt-1.5 text-[16px] font-semibold tracking-[-0.03em] text-white sm:text-[17px]">{label}</div>
      <div className="mt-2 text-[22px] font-semibold tracking-[-0.05em] text-white sm:text-[24px]">{value}</div>
      <div className="mt-1 text-[12px] leading-5 text-neutral-400 sm:text-[13px]">{detail}</div>
    </div>
  );
}

function EmptyBlock({ message }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-neutral-500">
      {message}
    </div>
  );
}

function RecentResultCard({ item, compact = false }) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-black/20 px-3.5 py-3 sm:rounded-[18px] sm:px-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`truncate font-medium text-white ${
              compact ? "text-[13px]" : "text-sm"
            }`}
          >
            {item.title || "Battle Trivia session"}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {formatDateTime(item.endedAt)}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold text-blue-300">
            {item.score} pts
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">#{item.rank}</div>
        </div>
      </div>
    </div>
  );
}

function NextMoveCard({ title, description, to, actionLabel, accent = "blue" }) {
  const accentClass =
    accent === "violet"
      ? "border-violet-400/18 bg-violet-500/10 text-violet-200"
      : accent === "emerald"
      ? "border-emerald-400/18 bg-emerald-500/10 text-emerald-200"
      : "border-blue-400/18 bg-blue-500/10 text-blue-200";

  return (
    <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-1.5 text-[12px] leading-5 text-neutral-400">
            {description}
          </div>
        </div>

        <Link
          to={to}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] transition hover:opacity-90 ${accentClass}`}
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const { resolvedTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [progression, setProgression] = useState(null);
  const [history, setHistory] = useState([]);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingProgression, setIsLoadingProgression] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoadingProfile(true);

      try {
        const data = await getMyProfile();
        if (!isMounted) return;
        setProfile(data);
      } catch {
        if (!isMounted) return;
        setError("Failed to load activity overview.");
      } finally {
        if (!isMounted) return;
        setIsLoadingProfile(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProgression() {
      setIsLoadingProgression(true);

      try {
        const data = await getMyProgression();
        if (!isMounted) return;
        setProgression(data);
      } catch {
        if (!isMounted) return;
        setError("Failed to load progression.");
      } finally {
        if (!isMounted) return;
        setIsLoadingProgression(false);
      }
    }

    loadProgression();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setIsLoadingHistory(true);

      try {
        const data = await getMyProfileHistory(page, pageSize);
        if (!isMounted) return;

        setHistory(Array.isArray(data?.items) ? data.items : []);
        setTotalPages(data?.totalPages || 1);
      } catch {
        if (!isMounted) return;
        setError("Failed to load activity history.");
      } finally {
        if (!isMounted) return;
        setIsLoadingHistory(false);
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [page]);

  const stats = useMemo(() => profile?.stats || {}, [profile]);
  const recentHighlights = useMemo(() => history.slice(0, 3), [history]);
  const isLight = resolvedTheme === "light";
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  return (
    <div
      className={`activity-page min-h-screen bg-neutral-950 text-white ${
        isLight ? "activity-page--light" : ""
      }`}
      style={lightModeUndoFilter}
    >
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />

        <AppTopBar
          eyebrow="Activity"
          title="Your activity"
          description="Recent results, progression, and performance over time."
          actions={[]}
        />

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            label="History loaded"
            value={history.length}
            detail="Recent recorded sessions currently loaded into this activity view."
            accent="blue"
          />
          <SummaryCard
            label="Current page"
            value={page}
            detail={`Browsing page ${page} of ${totalPages} in your full recorded battle history.`}
            accent="violet"
          />
          <SummaryCard
            label="Highlights"
            value={recentHighlights.length}
            detail="Latest notable results surfaced into the highlight rail for quick review."
            accent="emerald"
          />
        </div>

        {error ? (
          <div className="mb-4 rounded-[20px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {error}
          </div>
        ) : null}

        <section className="mb-6 sm:mb-7">
          <SectionHeader
            eyebrow="Overview"
            title="Performance snapshot"
            description="A quick read on your all-time pace and momentum."
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {isLoadingProfile ? (
              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-neutral-500 sm:col-span-2 xl:col-span-4">
                Loading activity overview...
              </div>
            ) : (
              <>
                <StatCard
                  label="Correct answers"
                  value={stats.totalCorrectAnswers ?? 0}
                />
                <StatCard label="Best streak" value={`x${stats.bestStreak ?? 0}`} />
                <StatCard label="Weekly wins" value={stats.weeklyWins ?? 0} />
                <StatCard
                  label="Fastest correct"
                  value={formatFastest(stats.fastestCorrectAnswerMs)}
                />
              </>
            )}
          </div>
        </section>

        <section className="mb-6 sm:mb-7">
          <SectionHeader
            eyebrow="Progress"
            title="Progression and achievements"
            description="Track how your account is developing over time."
          />

          <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr] lg:gap-5">
            <ProfileProgressCard
              progression={progression}
              loading={isLoadingProgression}
            />

            <ProfileAchievementsCard
              progression={progression}
              loading={isLoadingProgression}
            />
          </div>
        </section>

        <section className="mb-6 sm:mb-7">
          <SectionHeader
            eyebrow="Recent"
            title="Highlights"
            description="Your latest notable results and the best next move."
            action={
              <Link
                to="/leaderboards?mode=battle-trivia&period=current"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-white/15 hover:bg-white/[0.05] sm:rounded-[18px] sm:px-4 sm:py-2 sm:text-sm"
              >
                View standings
                <span aria-hidden="true">→</span>
              </Link>
            }
          />

          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-5">
            <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 sm:rounded-[24px] sm:p-4">
              {isLoadingHistory ? (
                <EmptyBlock message="Loading recent highlights..." />
              ) : recentHighlights.length === 0 ? (
                <EmptyBlock message="No recent activity yet." />
              ) : (
                <div className="space-y-2.5">
                  {recentHighlights.map((item) => (
                    <RecentResultCard key={item.id} item={item} compact />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 sm:rounded-[24px] sm:p-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Next up
              </div>
              <div className="mt-1.5 text-[15px] font-semibold tracking-[-0.03em] text-white sm:text-[17px]">
                Keep momentum going
              </div>
              <div className="mt-2 text-[12px] leading-5 text-neutral-400 sm:text-[13px]">
                Use this page to review your recent results, then move into the
                next section that helps most.
              </div>

              <div className="mt-3 space-y-2.5">
                <NextMoveCard
                  title="Compare your latest results"
                  description="Open the weekly standings and see how your recent sessions stack up."
                  to="/leaderboards?mode=battle-trivia&period=current"
                  actionLabel="Compare"
                  accent="blue"
                />
                <NextMoveCard
                  title="Jump back into competition"
                  description="Go straight into the game rooms and keep building your history."
                  to="/rooms"
                  actionLabel="Play"
                  accent="violet"
                />
                <NextMoveCard
                  title="Review your profile"
                  description="Update your details and check your broader account stats."
                  to="/profile"
                  actionLabel="Open"
                  accent="emerald"
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="History"
            title="Full battle history"
            description="All recorded results, paged for easier browsing."
            action={
              <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                Page {page} of {totalPages}
              </div>
            }
          />

          <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 sm:rounded-[24px] sm:p-4">
            {isLoadingHistory ? (
              <EmptyBlock message="Loading history..." />
            ) : history.length === 0 ? (
              <EmptyBlock message="No history yet." />
            ) : (
              <div className="space-y-2.5">
                {history.map((item) => (
                  <RecentResultCard key={item.id} item={item} />
                ))}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white transition hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white transition hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
