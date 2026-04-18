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

function StatCard({ label, value }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function RecentResultCard({ item }) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-white">
            {item.title || "Battle Trivia session"}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {formatDateTime(item.endedAt)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold text-blue-300">
            {item.score} pts
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            #{item.rank}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const [profile, setProfile] = useState(null);
  const [progression, setProgression] = useState(null);
  const [history, setHistory] = useState([]);

  const [page, setPage] = useState(1);
  const pageSize = 12;
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

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-[76rem] px-4 py-6 pb-24 sm:px-5 sm:py-8 sm:pb-8 lg:px-6 lg:py-10">
        <AppSectionNav />
        <AppTopBar
          eyebrow="Activity"
          title="Your activity"
          description="A dedicated view for your recent results, progression, and performance over time without bloating the dashboard."
          actions={[
            {
              to: "/profile",
              label: "Profile",
              sublabel: "Account and settings",
            },
            {
              to: "/leaderboards?mode=combined&period=current",
              label: "Standings",
              sublabel: "Weekly rankings",
            },
          ]}
        />

        {error ? (
          <div className="mb-4 rounded-[20px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

        <div className="mb-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <ProfileProgressCard
            progression={progression}
            loading={isLoadingProgression}
          />

          <ProfileAchievementsCard
            progression={progression}
            loading={isLoadingProgression}
          />
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white">
                Recent highlights
              </div>

              <Link
                to="/leaderboards?mode=combined&period=current"
                className="text-[11px] font-medium uppercase tracking-[0.16em] text-blue-300/80"
              >
                View standings
              </Link>
            </div>

            {isLoadingHistory ? (
              <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-4 py-6 text-sm text-neutral-500">
                Loading recent highlights...
              </div>
            ) : recentHighlights.length === 0 ? (
              <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-4 py-6 text-sm text-neutral-500">
                No recent activity yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentHighlights.map((item) => (
                  <RecentResultCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 text-sm font-semibold text-white">
              Activity notes
            </div>

            <div className="space-y-3">
              <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                  Use this page for
                </div>
                <div className="mt-2 text-sm text-white">
                  Reviewing your recent sessions without going deep into profile settings.
                </div>
              </div>

              <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                  Best next step
                </div>
                <div className="mt-2 text-sm text-white">
                  Compare your latest results against the weekly standings, then jump back into the featured room.
                </div>
              </div>

              <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                  Quick links
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to="/"
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-white/15 hover:bg-white/[0.06]"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/rooms"
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-white/15 hover:bg-white/[0.06]"
                  >
                    Game rooms
                  </Link>
                  <Link
                    to="/leaderboards?mode=combined&period=current"
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-white/15 hover:bg-white/[0.06]"
                  >
                    Standings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">
              Full battle history
            </div>

            <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              Page {page} of {totalPages}
            </div>
          </div>

          {isLoadingHistory ? (
            <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-4 py-6 text-sm text-neutral-500">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-4 py-6 text-sm text-neutral-500">
              No history yet.
            </div>
          ) : (
            <div className="space-y-3">
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
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white transition hover:bg-white/[0.06] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}