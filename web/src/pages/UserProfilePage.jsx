import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppSectionNav from "../components/layout/AppSectionNav";
import AppTopBar from "../components/layout/AppTopBar";
import { getUserProfile } from "../api/profileApi";
import { useTheme } from "../hooks/useTheme";

function getInitials(value) {
  if (!value) return "P";

  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function formatFastest(ms) {
  if (typeof ms !== "number") return "-";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 10000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatPresence(profile) {
  if (!profile) return "";
  if (profile.isOnline) return "Online now";
  if (!profile.lastSeenAt) return "Offline";

  return `Last seen ${new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(profile.lastSeenAt))}`;
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-white">
        {value}
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const { userId } = useParams();
  const { resolvedTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!userId) {
        setError("Profile not found.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const data = await getUserProfile(userId);
        if (!isMounted) return;
        setProfile(data);
      } catch {
        if (!isMounted) return;
        setError("Could not load this profile.");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const stats = useMemo(() => profile?.stats || {}, [profile]);
  const isLight = resolvedTheme === "light";
  const lightModeUndoFilter = isLight
    ? {
        filter:
          "invert(1) hue-rotate(180deg) saturate(1.08) contrast(1.08) brightness(0.97)",
      }
    : undefined;

  return (
    <div
      className={`profile-page min-h-screen bg-neutral-950 text-white ${
        isLight ? "profile-page--light" : ""
      }`}
      style={lightModeUndoFilter}
    >
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />

        <AppTopBar
          eyebrow="Profile"
          title={profile?.displayName || "Player profile"}
          description="DM identity, current status, and all-time game stats."
          actions={[
            {
              label: "Back to my profile",
              to: "/profile",
            },
            {
              label: "Open messages",
              to: "/messages",
            },
          ]}
        />

        {error ? (
          <div className="mb-4 rounded-[20px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500">
            Loading profile...
          </div>
        ) : profile ? (
          <div className="space-y-6">
            <section className="rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-5 sm:rounded-[26px]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.05]">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName || profile.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
                      {getInitials(profile.displayName || profile.username)}
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-neutral-950 ${
                      profile.isOnline ? "bg-emerald-400" : "bg-neutral-600"
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    DM profile
                  </div>
                  <div className="mt-1.5 break-words text-[28px] font-semibold tracking-[-0.03em] text-white">
                    {profile.displayName || profile.username}
                  </div>
                  <div className="mt-1 break-all text-sm text-neutral-400">
                    @{profile.username}
                  </div>
                  <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-300">
                    {formatPresence(profile)}
                  </div>

                  <div className="mt-4 rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      Status
                    </div>
                    <div className="mt-1 text-sm leading-6 text-white">
                      {profile.statusMessage || "No status set right now."}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Stats
                </div>
                <div className="mt-1 text-[19px] font-semibold tracking-[-0.03em] text-white">
                  All-time numbers
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Battle Trivia correct" value={stats.totalCorrectAnswers ?? 0} />
                <StatCard
                  label="Word Scramble correct"
                  value={stats.wordScrambleCorrectAnswers ?? 0}
                />
                <StatCard label="Weekly wins" value={stats.weeklyWins ?? 0} />
                <StatCard label="Fastest correct" value={formatFastest(stats.fastestCorrectAnswerMs)} />
              </div>
            </section>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm text-neutral-400">
                Want to update your own photo, status, or account details?
              </div>
              <Link
                to="/profile"
                className="mt-3 inline-flex rounded-[16px] bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Edit my profile
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
