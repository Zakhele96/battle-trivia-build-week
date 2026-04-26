import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  changeMyPassword,
  getMyProfile,
  getMyProfileHistory,
  getMyProgression,
  updateMyProfile,
} from "../api/profileApi";
import { getLeaderboard } from "../api/leaderboardsApi";
import ProfileAchievementsCard from "../components/profile/ProfileAchievementsCard";
import ProfileProgressCard from "../components/profile/ProfileProgressCard";
import AppTopBar from "../components/layout/AppTopBar";
import AppSectionNav from "../components/layout/AppSectionNav";
import { useSoundPreferences } from "../hooks/useSoundPreferences";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import {
  buildPlayerRecapImageUrl,
  buildPlayerRecapUrl,
  buildShareUrl,
  downloadImageUrlPng,
  downloadShareCardPng,
} from "../services/leaderboardShare";

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

function GameBreakdownCard({
  eyebrow,
  title,
  description,
  accent = "blue",
  stats = [],
}) {
  const accentClass =
    accent === "violet"
      ? "border-violet-400/18 bg-violet-500/10 text-violet-200"
      : "border-blue-400/18 bg-blue-500/10 text-blue-200";

  return (
    <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4 sm:rounded-[24px] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            {eyebrow}
          </div>
          <div className="mt-1.5 text-[18px] font-semibold tracking-[-0.03em] text-white">
            {title}
          </div>
          <div className="mt-1 text-[12px] leading-5 text-neutral-400">
            {description}
          </div>
        </div>

        <div
          className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${accentClass}`}
        >
          Stats
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
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

function HistoryItem({ item }) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-black/20 px-3.5 py-3 sm:rounded-[18px] sm:px-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-white">
            {item.title || "Battle Trivia session"}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {formatDate(item.endedAt)}
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

function IdentityCard({ profile, authUser }) {
  const displayName =
    profile?.displayName ||
    authUser?.displayName ||
    profile?.username ||
    authUser?.username ||
    "Player";

  const username = profile?.username || authUser?.username || "username";
  const avatarUrl = authUser?.avatarUrl || null;
  const providerLabel =
    authUser?.authProvider === "google" ? "Google account" : "BTS account";

  return (
    <div className="rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4 sm:rounded-[26px] sm:p-5">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.05] sm:h-16 sm:w-16">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-base font-semibold text-white sm:text-lg">
              {getInitials(displayName)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 sm:text-[11px]">
            Account identity
          </div>

          <div className="mt-1.5 text-[22px] font-semibold tracking-[-0.03em] text-white sm:text-[24px]">
            {displayName}
          </div>

          <div className="mt-1 text-sm text-neutral-400">@{username}</div>

          <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-300">
            {providerLabel}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Email
          </div>
          <div className="mt-1 text-sm text-white">
            {profile?.email || authUser?.email || "—"}
          </div>
        </div>

        <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-3">
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
    <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4 sm:rounded-[24px] sm:p-5">
      <div className="mb-3 text-sm font-semibold text-white">Sign-in method</div>

      <div className="rounded-[16px] border border-white/8 bg-black/20 px-4 py-4">
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

function GrowthInviteCard({
  growth,
  onCopyInvite,
  onShareInvite,
  onDownloadCard,
  onShareRecap,
  onDownloadRecap,
  momentum,
}) {
  const showMomentum = Boolean(momentum);

  return (
    <div className="rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4 sm:rounded-[24px] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-300/70">
            Invite loop
          </div>
          <div className="mt-1.5 text-[18px] font-semibold tracking-[-0.03em] text-white">
            Bring people into your weekly race
          </div>
          <div className="mt-1 text-[12px] leading-5 text-neutral-400">
            Share your BTS page, challenge friends to beat your rank, and turn your own progress into sign-ups.
          </div>
        </div>

        <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-100">
          Growth ready
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard label="Share views" value={growth?.shareViews ?? 0} />
        <StatCard label="Join clicks" value={growth?.joinClicks ?? 0} />
        <StatCard label="Sign-ups" value={growth?.referredSignups ?? 0} />
      </div>

      {showMomentum ? (
        <div className="mt-4 rounded-[18px] border border-violet-400/18 bg-violet-500/10 px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-violet-100/75">
            Momentum
          </div>
          <div className="mt-1 text-sm text-white">{momentum.title}</div>
          <div className="mt-1 text-[12px] leading-5 text-violet-100/80">
            {momentum.detail}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onCopyInvite}
          className="rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
        >
          Copy invite link
        </button>
        <button
          type="button"
          onClick={onShareInvite}
          className="rounded-[16px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
        >
          Challenge friends
        </button>
        <button
          type="button"
          onClick={onDownloadCard}
          className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
        >
          Download rank card
        </button>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onShareRecap}
          className="rounded-[16px] border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/15"
        >
          Share weekly recap
        </button>
        <button
          type="button"
          onClick={onDownloadRecap}
          className="rounded-[16px] border border-amber-300/18 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/15"
        >
          Download weekly recap
        </button>
      </div>
    </div>
  );
}

function ChoiceIndicator({ active, isLight = false }) {
  return (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
        active
          ? isLight
            ? "border-sky-400 bg-sky-50 shadow-[0_0_0_3px_rgba(14,116,144,0.08)]"
            : "border-blue-300/50 bg-blue-400/18 shadow-[0_0_0_3px_rgba(96,165,250,0.08)]"
          : isLight
          ? "border-[#d6c2a4] bg-white/70"
          : "border-white/12 bg-white/[0.03]"
      }`}
      aria-hidden="true"
    >
      <span
        className={`h-2.5 w-2.5 rounded-full transition ${
          active ? (isLight ? "bg-sky-600" : "bg-blue-100") : "bg-transparent"
        }`}
      />
    </span>
  );
}

function ThemeCard({ themePreference, setThemePreference, isLight = false }) {
  const options = [
    {
      value: "system",
      label: "Follow device",
      description: "Switch automatically with your phone or desktop theme.",
    },
    {
      value: "dark",
      label: "Dark",
      description: "Keep the current dark look everywhere.",
    },
    {
      value: "light",
      label: "Light",
      description: "Use the lighter app appearance.",
    },
  ];

  return (
    <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4 sm:rounded-[24px] sm:p-5">
      <div className="mb-4">
        <div className="text-sm font-semibold text-white">Theme</div>
        <div className="mt-1 text-sm text-neutral-400">
          Choose how the app should look for you.
        </div>
      </div>

      <div className="space-y-3" role="radiogroup" aria-label="Theme preference">
        {options.map((option) => {
          const active = themePreference === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setThemePreference(option.value)}
              className={`w-full rounded-[16px] border px-4 py-3 text-left transition ${
                active
                  ? "border-blue-300/22 bg-blue-500/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">
                    {option.label}
                  </div>
                  <div className="mt-1 text-[12px] leading-5 text-neutral-400">
                    {option.description}
                  </div>
                </div>

                <ChoiceIndicator active={active} isLight={isLight} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreferenceToggle({
  label,
  description,
  active,
  onToggle,
  isLight = false,
  accentClass = "border-blue-300/22 bg-blue-500/10",
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => onToggle(!active)}
      className={`w-full rounded-[16px] border px-4 py-3 text-left transition ${
        active
          ? accentClass
          : "border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="mt-1 text-[12px] leading-5 text-neutral-400">
            {description}
          </div>
        </div>

        <ChoiceIndicator active={active} isLight={isLight} />
      </div>
    </button>
  );
}

function SoundCard({
  soundEffectsEnabled,
  timerWarningsEnabled,
  setSoundEffectsEnabled,
  setTimerWarningsEnabled,
  isLight = false,
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4 sm:rounded-[24px] sm:p-5">
      <div className="mb-4">
        <div className="text-sm font-semibold text-white">Sound</div>
        <div className="mt-1 text-sm text-neutral-400">
          Keep game feedback lively with local sound cues that only play on your
          device.
        </div>
      </div>

      <div className="space-y-3">
        <PreferenceToggle
          label="Sound effects"
          description="Play a soft chime when you answer correctly in Battle Trivia or solve a Word Scramble round."
          active={soundEffectsEnabled}
          onToggle={setSoundEffectsEnabled}
          isLight={isLight}
        />

        <PreferenceToggle
          label="Timer warnings"
          description="Play subtle end-of-round cues in the final seconds so you can react faster on mobile."
          active={timerWarningsEnabled}
          onToggle={setTimerWarningsEnabled}
          isLight={isLight}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();
  const { themePreference, setThemePreference, resolvedTheme } = useTheme();
  const {
    soundEffectsEnabled,
    timerWarningsEnabled,
    setSoundEffectsEnabled,
    setTimerWarningsEnabled,
  } = useSoundPreferences();

  const [profile, setProfile] = useState(null);
  const [progression, setProgression] = useState(null);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 8;
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
  const [growthMessage, setGrowthMessage] = useState("");
  const [playerMomentum, setPlayerMomentum] = useState(null);

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

  useEffect(() => {
    let isMounted = true;

    async function loadMomentum() {
      if (!authUser?.id) return;

      try {
        const [currentBoard, previousBoard] = await Promise.all([
          getLeaderboard("combined", "current", 200),
          getLeaderboard("combined", "previous", 200),
        ]);

        if (!isMounted) return;

        const currentRow =
          currentBoard?.rows?.find((row) => row.userId === authUser.id) || null;
        const previousRow =
          previousBoard?.rows?.find((row) => row.userId === authUser.id) || null;
        const leaderScore = currentBoard?.rows?.[0]?.score ?? 0;

        if (previousRow) {
          const delta = currentRow
            ? previousRow.rank - currentRow.rank
            : 0;

          setPlayerMomentum({
            title: currentRow
              ? delta > 0
                ? `You climbed ${delta} spot${delta === 1 ? "" : "s"} since last week.`
                : delta < 0
                ? `You slipped ${Math.abs(delta)} spot${Math.abs(delta) === 1 ? "" : "s"} from last week.`
                : "You held the same place as last week."
              : "Your weekly recap is ready to post.",
            detail: currentRow
              ? currentRow.rank === 1
                ? "You are leading the current combined board right now."
                : `${Math.max(0, leaderScore - currentRow.score)} point${Math.max(0, leaderScore - currentRow.score) === 1 ? "" : "s"} separate you from the current leader.`
              : `Last week you finished #${previousRow.rank} with ${previousRow.score} points.`,
          });
          return;
        }

        if (currentRow) {
          setPlayerMomentum({
            title: `You are currently #${currentRow.rank} on the combined board.`,
            detail:
              currentRow.rank === 1
                ? "Protect the lead and post the recap when the week closes."
                : `${Math.max(0, leaderScore - currentRow.score)} point${Math.max(0, leaderScore - currentRow.score) === 1 ? "" : "s"} behind the leader right now.`,
          });
        } else {
          setPlayerMomentum(null);
        }
      } catch {
        if (!isMounted) return;
        setPlayerMomentum(null);
      }
    }

    loadMomentum();

    return () => {
      isMounted = false;
    };
  }, [authUser?.id]);

  const stats = useMemo(() => profile?.stats || {}, [profile]);
  const growth = useMemo(() => profile?.growth || {}, [profile]);

const loginProvider = localStorage.getItem("bts_login_provider");
const isGoogleAccount = loginProvider === "google";

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

  const handleCopyInvite = async () => {
    if (!authUser?.id) return;

    try {
      await navigator.clipboard.writeText(
        buildShareUrl("combined", "current", authUser.id)
      );
      setGrowthMessage("Invite link copied.");
    } catch {
      setGrowthMessage("Could not copy invite link.");
    }
  };

  const handleShareInvite = async () => {
    if (!authUser?.id) return;

    const url = buildShareUrl("combined", "current", authUser.id);
    const playerName =
      profile?.displayName || authUser.displayName || profile?.username || authUser.username || "I";
    const text = `${playerName} just challenged you to join BTS and chase them on this week's leaderboard. Create your account and see if you can beat them.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Beat me on BTS",
          text,
          url,
        });
        setGrowthMessage("Share sheet opened.");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url}`);
      setGrowthMessage("Challenge text copied.");
    } catch {
      setGrowthMessage("Could not share challenge right now.");
    }
  };

  const handleDownloadGrowthCard = async () => {
    if (!authUser?.id) return;

    try {
      await downloadShareCardPng({
        mode: "combined",
        period: "current",
        userId: authUser.id,
        filenameBase: `${profile?.displayName || profile?.username || "player"}-bts-growth-card`,
      });
      setGrowthMessage("Rank card downloaded.");
    } catch {
      setGrowthMessage("Could not download rank card.");
    }
  };

  const handleShareWeeklyRecap = async () => {
    if (!authUser?.id) return;

    const url = buildPlayerRecapUrl(authUser.id, "combined", "previous");
    const playerName =
      profile?.displayName || authUser.displayName || profile?.username || authUser.username || "I";
    const text = `${playerName} just posted their BTS weekly recap. See how they finished and create your own account to get on next week's board.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My BTS weekly recap",
          text,
          url,
        });
        setGrowthMessage("Weekly recap share sheet opened.");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url}`);
      setGrowthMessage("Weekly recap copied.");
    } catch {
      setGrowthMessage("Could not share weekly recap right now.");
    }
  };

  const handleDownloadWeeklyRecap = async () => {
    if (!authUser?.id) return;

    try {
      await downloadImageUrlPng(
        buildPlayerRecapImageUrl(authUser.id, "combined", "previous"),
        `${profile?.displayName || profile?.username || "player"}-weekly-recap`
      );
      setGrowthMessage("Weekly recap downloaded.");
    } catch {
      setGrowthMessage("Could not download weekly recap.");
    }
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
      className={`profile-page min-h-screen bg-neutral-950 text-white ${
        isLight ? "profile-page--light" : ""
      }`}
      style={lightModeUndoFilter}
    >
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />

        <AppTopBar
          eyebrow="Profile"
          title="Your account"
          description="Manage your details, security, progression, and history."
          actions={[]}
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

        <div className="mb-6 sm:mb-7">
          <IdentityCard profile={profile} authUser={authUser} />
        </div>

        <section className="mb-6 sm:mb-7">
          <SectionHeader
            eyebrow="Growth"
            title="Invite and flex"
            description="Turn your own profile and leaderboard energy into challenges people can actually join."
          />

          <GrowthInviteCard
            growth={growth}
            onCopyInvite={handleCopyInvite}
            onShareInvite={handleShareInvite}
            onDownloadCard={handleDownloadGrowthCard}
            onShareRecap={handleShareWeeklyRecap}
            onDownloadRecap={handleDownloadWeeklyRecap}
            momentum={playerMomentum}
          />

          {growthMessage ? (
            <div className="mt-3 text-sm text-neutral-400">{growthMessage}</div>
          ) : null}
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

        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-5">
          <div className="space-y-6">
            <section>
              <SectionHeader
                eyebrow="Account"
                title="Details"
                description="Update the basics of your account here."
              />

              <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4 sm:rounded-[24px] sm:p-5">
                {isLoadingProfile ? (
                  <EmptyBlock message="Loading profile..." />
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

                    <div className="flex flex-wrap gap-3 pt-1">
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
            </section>

            <section>
              <SectionHeader
                eyebrow="Security"
                title="Sign-in and password"
                description="Keep your access method clear and up to date."
              />

              {!isGoogleAccount ? (
                <div className="grid gap-4">
                  <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4 sm:rounded-[24px] sm:p-5">
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

                  <ThemeCard
                    themePreference={themePreference}
                    setThemePreference={setThemePreference}
                    isLight={isLight}
                  />
                  <SoundCard
                    soundEffectsEnabled={soundEffectsEnabled}
                    timerWarningsEnabled={timerWarningsEnabled}
                    setSoundEffectsEnabled={setSoundEffectsEnabled}
                    setTimerWarningsEnabled={setTimerWarningsEnabled}
                    isLight={isLight}
                  />
                </div>
              ) : (
                <div className="grid gap-4">
                  <SignInMethodCard isGoogleAccount={isGoogleAccount} />
                  <ThemeCard
                    themePreference={themePreference}
                    setThemePreference={setThemePreference}
                    isLight={isLight}
                  />
                  <SoundCard
                    soundEffectsEnabled={soundEffectsEnabled}
                    timerWarningsEnabled={timerWarningsEnabled}
                    setSoundEffectsEnabled={setSoundEffectsEnabled}
                    setTimerWarningsEnabled={setTimerWarningsEnabled}
                    isLight={isLight}
                  />
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section>
              <SectionHeader
                eyebrow="Stats"
                title="All-time numbers"
                description="A compact cross-account snapshot without repeating the full game breakdown below."
                action={
                  <Link
                    to="/leaderboards?mode=combined&period=current"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-white/15 hover:bg-white/[0.05] sm:rounded-[18px] sm:px-4 sm:py-2 sm:text-sm"
                  >
                    View standings
                    <span aria-hidden="true">→</span>
                  </Link>
                }
              />

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Battle Trivia correct"
                  value={stats.totalCorrectAnswers ?? 0}
                />
                <StatCard
                  label="Word Scramble correct"
                  value={stats.wordScrambleCorrectAnswers ?? 0}
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
            </section>

            <section>
              <SectionHeader
                eyebrow="Games"
                title="Game breakdown"
                description="Separate cards keep Battle Trivia and Word Scramble stats tidy."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <GameBreakdownCard
                  eyebrow="Battle Trivia"
                  title="Performance"
                  description="Your long-term Battle Trivia profile."
                  accent="blue"
                  stats={[
                    {
                      label: "Correct answers",
                      value: stats.totalCorrectAnswers ?? 0,
                    },
                    {
                      label: "Best streak",
                      value: `x${stats.bestStreak ?? 0}`,
                    },
                    {
                      label: "Weekly wins",
                      value: stats.weeklyWins ?? 0,
                    },
                    {
                      label: "Fastest correct",
                      value: formatFastest(stats.fastestCorrectAnswerMs),
                    },
                  ]}
                />

                <GameBreakdownCard
                  eyebrow="Word Scramble"
                  title="Performance"
                  description="Your all-time correct solves in Word Scramble."
                  accent="violet"
                  stats={[
                    {
                      label: "Correct answers",
                      value: stats.wordScrambleCorrectAnswers ?? 0,
                    },
                    {
                      label: "Mode",
                      value: "Word Scramble",
                    },
                  ]}
                />
              </div>
            </section>

            <section>
              <SectionHeader
                eyebrow="History"
                title="Battle Trivia history"
                description="Your recent results, with the full activity view one tap away."
                action={
                  <Link
                    to="/activity"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-white/15 hover:bg-white/[0.05] sm:rounded-[18px] sm:px-4 sm:py-2 sm:text-sm"
                  >
                    Open activity
                    <span aria-hidden="true">→</span>
                  </Link>
                }
              />

              <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-4 sm:rounded-[24px] sm:p-5">
                {isLoadingHistory ? (
                  <EmptyBlock message="Loading history..." />
                ) : history.length === 0 ? (
                  <EmptyBlock message="No history yet." />
                ) : (
                  <div className="space-y-2.5">
                    {history.map((item) => (
                      <HistoryItem key={item.id} item={item} />
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
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
