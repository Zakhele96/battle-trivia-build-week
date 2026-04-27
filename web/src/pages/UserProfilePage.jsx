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

function Panel({ children, className = "" }) {
  return (
    <div
      className={`rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4 sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-white">
        {value}
      </div>
      {detail ? <div className="mt-1 text-[12px] text-neutral-400">{detail}</div> : null}
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
        if (isMounted) setProfile(data);
      } catch {
        if (isMounted) setError("Could not load this profile.");
      } finally {
        if (isMounted) setIsLoading(false);
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
          description="A simple DM profile view: who this is, their current status, and their long-term stats."
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
          <Panel className="px-4 py-10 text-center text-sm text-neutral-500">
            Loading profile...
          </Panel>
        ) : profile ? (
          <div className="space-y-6">
            <Panel className="rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))] p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
                    <div className="h-full w-full overflow-hidden rounded-full border border-white/10 bg-white/[0.05]">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.displayName || profile.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white">
                          {getInitials(profile.displayName || profile.username)}
                        </div>
                      )}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-neutral-950 ${
                        profile.isOnline ? "bg-emerald-400" : "bg-neutral-600"
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-blue-300/70">
                      DM profile
                    </div>
                    <div className="mt-2 break-words text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[34px]">
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
                        Current status
                      </div>
                      <div className="mt-1 text-sm leading-6 text-white">
                        {profile.statusMessage || "No status set right now."}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:w-[24rem]">
                  <StatCard label="Presence" value={profile.isOnline ? "Online" : "Offline"} />
                  <StatCard label="Best speed" value={formatFastest(stats.fastestCorrectAnswerMs)} />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Battle Trivia correct" value={stats.totalCorrectAnswers ?? 0} />
                <StatCard
                  label="Word Scramble correct"
                  value={stats.wordScrambleCorrectAnswers ?? 0}
                />
                <StatCard label="Weekly wins" value={stats.weeklyWins ?? 0} />
                <StatCard label="Fastest correct" value={formatFastest(stats.fastestCorrectAnswerMs)} />
              </div>
            </Panel>

            <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
              <Panel>
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  What to know
                </div>
                <div className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-white">
                  A clean read on this player
                </div>
                <div className="mt-2 text-sm leading-6 text-neutral-400">
                  This page focuses on the basics you need inside DMs: their name, whether they are around, what status they set, and the long-term game numbers that tell you how established they are.
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <StatCard label="Name shown" value={profile.displayName || profile.username} />
                  <StatCard label="Username" value={`@${profile.username}`} />
                </div>
              </Panel>

              <Panel>
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Next step
                </div>
                <div className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-white">
                  Need to update your own?
                </div>
                <div className="mt-2 text-sm leading-6 text-neutral-400">
                  Photos, DM status, and your own account details live on your personal profile page.
                </div>
                <Link
                  to="/profile"
                  className="mt-4 inline-flex rounded-[16px] bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Edit my profile
                </Link>
              </Panel>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
