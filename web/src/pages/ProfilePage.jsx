import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  changeMyPassword,
  getMyProfile,
  getMyProfileHistory,
  getMyProgression,
  updateMyProfile,
} from "../api/profileApi";
import ProfileAchievementsCard from "../components/profile/ProfileAchievementsCard";
import ProfileProgressCard from "../components/profile/ProfileProgressCard";
import AppTopBar from "../components/layout/AppTopBar";
import { useAuth } from "../hooks/useAuth";

function formatFastest(ms) {
  if (typeof ms !== "number") return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 10000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getInitials(value) {
  if (!value) return "P";

  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
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

function IdentityCard({ profile, authUser }) {
  const displayName =
    profile?.displayName || authUser?.displayName || profile?.username || authUser?.username || "Player";

  const username = profile?.username || authUser?.username || "username";
  const avatarUrl = authUser?.avatarUrl || null;
  const providerLabel =
    authUser?.authProvider === "google" ? "Google account" : "BTS account";

  return (
    <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-5">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.05]">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">
              {getInitials(displayName)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            Account identity
          </div>

          <div className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-white">
            {displayName}
          </div>

          <div className="mt-1 text-sm text-neutral-400">@{username}</div>

          <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-300">
            {providerLabel}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Email
          </div>
          <div className="mt-1 text-sm text-white">{profile?.email || authUser?.email || "—"}</div>
        </div>

        <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Phone
          </div>
          <div className="mt-1 text-sm text-white">
            {profile?.phoneNumber || authUser?.phoneNumber || "Not added"}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignInMethodCard({ isGoogleAccount }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 text-sm font-semibold text-white">
        Sign-in method
      </div>

      <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-4">
        <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          Provider
        </div>

        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-white">
          {isGoogleAccount ? "Google" : "BTS"}
        </div>

        <div className="mt-3 text-sm text-neutral-400">
          {isGoogleAccount
            ? "This account signs in with Google, so password changes are not needed here."
            : "This account uses your BTS password for sign-in."}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [progression, setProgression] = useState(null);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingProgression, setIsLoadingProgression] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoadingProfile(true);

      try {
        const data = await getMyProfile();
        if (!isMounted) return;

        setProfile(data);
        setDisplayName(data?.displayName || "");
        setPhoneNumber(data?.phoneNumber || "");
      } catch {
        if (!isMounted) return;
        setError("Failed to load profile.");
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
        setError("Failed to load profile history.");
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

  const isGoogleAccount =
    authUser?.authProvider === "google" && authUser?.hasPassword === false;

  async function handleSaveProfile(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      setIsSavingProfile(true);

      const updated = await updateMyProfile({
        displayName,
        phoneNumber,
      });

      setProfile(updated);
      setMessage("Profile updated.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      setIsSavingPassword(true);

      await changeMyPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to change password.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-[76rem] px-4 py-6 sm:px-5 sm:py-8 lg:px-6 lg:py-10">
        <AppTopBar
          eyebrow="Profile"
          title="Your account"
          description="Manage your details, progression, and all-time performance from one place."
          actions={[
            {
              to: "/leaderboards?mode=combined&period=current",
              label: "Leaderboards",
              sublabel: "View standings",
            },
          ]}
        />

        {error ? (
          <div className="mb-4 rounded-[20px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-[20px] border border-emerald-900/35 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-300/90">
            {message}
          </div>
        ) : null}

        <div className="mb-6">
          <IdentityCard profile={profile} authUser={authUser} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 text-sm font-semibold text-white">
                Account
              </div>

              {isLoadingProfile ? (
                <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-4 py-6 text-sm text-neutral-500">
                  Loading profile...
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                      Username
                    </label>
                    <input
                      value={profile?.username || authUser?.username || ""}
                      disabled
                      className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                      Email
                    </label>
                    <input
                      value={profile?.email || authUser?.email || ""}
                      disabled
                      className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                      Display name
                    </label>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                      Phone number
                    </label>
                    <input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="rounded-[16px] bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                    >
                      {isSavingProfile ? "Saving..." : "Save profile"}
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-[16px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
                    >
                      Logout
                    </button>
                  </div>
                </form>
              )}
            </div>

            {!isGoogleAccount ? (
              <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 text-sm font-semibold text-white">
                  Change password
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
                  />

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
                  />

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/20"
                  />

                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="rounded-[16px] bg-white/[0.08] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:opacity-60"
                  >
                    {isSavingPassword ? "Updating..." : "Update password"}
                  </button>
                </form>
              </div>
            ) : (
              <SignInMethodCard isGoogleAccount={isGoogleAccount} />
            )}
          </div>

          <div className="space-y-6">
            <ProfileProgressCard
              progression={progression}
              loading={isLoadingProgression}
            />

            <ProfileAchievementsCard
              progression={progression}
              loading={isLoadingProgression}
            />

            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">
                  All-time stats
                </div>

                <Link
                  to="/leaderboards?mode=combined&period=current"
                  className="text-[11px] font-medium uppercase tracking-[0.16em] text-blue-300/80"
                >
                  View standings
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Correct answers"
                  value={stats.totalCorrectAnswers ?? 0}
                />
                <StatCard
                  label="Best streak"
                  value={`x${stats.bestStreak ?? 0}`}
                />
                <StatCard
                  label="Weekly wins"
                  value={stats.weeklyWins ?? 0}
                />
                <StatCard
                  label="Fastest correct"
                  value={formatFastest(stats.fastestCorrectAnswerMs)}
                />
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 text-sm font-semibold text-white">
                Battle Trivia history
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
                    <div
                      key={item.id}
                      className="rounded-[18px] border border-white/6 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {item.title || "Battle Trivia session"}
                          </div>
                          <div className="mt-1 text-[11px] text-neutral-500">
                            {formatDate(item.endedAt)}
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

                    <div className="text-sm text-neutral-400">
                      Page {page} of {totalPages}
                    </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}