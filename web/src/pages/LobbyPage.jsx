import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FeaturedTriviaCard from "../components/lobby/FeaturedTriviaCard";
import LeaderboardPreviewCard from "../components/lobby/LeaderboardPreviewCard";
import AppSectionNav from "../components/layout/AppSectionNav";
import {
  getBattleTriviaSessionPodium,
  getCurrentBattleTriviaLeaderboard,
  getRoomSessionStatus,
  getRooms,
} from "../api/roomsApi";
import { getLeaderboard } from "../api/leaderboardsApi";
import { getMyProfile, getMyProfileHistory } from "../api/profileApi";
import { useAuth } from "../hooks/useAuth";
import { useMentions } from "../context/MentionContext";
import MentionInboxCard from "../components/mentions/MentionInboxCard";
import { getUnreadMentions } from "../api/roomsApi";

function formatEndedAt(value) {
  if (!value) return "Latest completed week";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Latest completed week";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value) {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getInitials(value) {
  if (!value) return "P";

  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function formatMentionCount(count) {
  return `${count} mention${count === 1 ? "" : "s"}`;
}

function SectionHeader({ eyebrow, title, description }) {
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
    </div>
  );
}

function QuickDestinationCard({ to, eyebrow, title, description }) {
  return (
    <Link
      to={to}
      className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] p-3.5 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] sm:rounded-[20px] sm:p-4"
    >
      <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500 sm:text-[10px]">
        {eyebrow}
      </div>

      <div className="mt-1.5 text-[14px] font-semibold tracking-[-0.03em] text-white sm:text-[15px]">
        {title}
      </div>

      <div className="mt-1 text-[12px] leading-5 text-neutral-400 sm:text-[13px] sm:leading-5">
        {description}
      </div>

      <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-blue-300/80">
        Open
        <span aria-hidden="true">→</span>
      </div>
    </Link>
  );
}

function LeaderCard({ entry }) {
  const isChampion = entry.rank === 1;

  return (
    <div
      className={`rounded-[16px] border p-3 sm:rounded-[18px] sm:p-3.5 ${
        isChampion
          ? "border-amber-400/20 bg-amber-500/10"
          : "border-white/8 bg-black/20"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] sm:text-[10px] ${
            isChampion
              ? "bg-amber-400/15 text-amber-200"
              : "bg-white/[0.05] text-neutral-400"
          }`}
        >
          #{entry.rank}
        </span>

        {isChampion ? <span aria-hidden="true">👑</span> : null}
      </div>

      <div className="mt-2.5 truncate text-[13px] font-semibold text-white sm:mt-3 sm:text-sm">
        {entry.displayName || entry.username}
      </div>

      <div className="mt-1 text-[10px] text-neutral-500 sm:text-[11px]">
        @{entry.username}
      </div>

      <div
        className={`mt-2.5 text-[13px] font-semibold sm:mt-3 sm:text-sm ${
          isChampion ? "text-amber-200" : "text-blue-300"
        }`}
      >
        {entry.score} pts
      </div>
    </div>
  );
}

function LeadersPanel({ title, subtitle, entries }) {
  return (
    <div className="mt-3 rounded-[18px] border border-white/10 bg-white/[0.03] p-3 sm:mt-4 sm:rounded-[22px] sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
            {title}
          </div>
          <div className="mt-1 text-[12px] text-neutral-300 sm:text-sm">
            {subtitle}
          </div>
        </div>

        <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-neutral-400 sm:text-[10px]">
          Top {entries.length}
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 sm:mt-4 sm:grid-cols-3 sm:gap-3">
        {entries.map((entry) => (
          <LeaderCard key={`${entry.userId}-${entry.rank}`} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function DashboardHero({ user, isFirstTimeUser }) {
  const displayName = user?.displayName || user?.username || "Player";
  const greeting = user?.displayName ? `Welcome, ${user.displayName}` : "Welcome";
  const providerLabel =
    user?.authProvider === "google" ? "Google sign-in" : "BTS sign-in";

  return (
    <div className="mb-5 rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.16)] sm:mb-7 sm:rounded-[30px] sm:p-5 lg:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.05] sm:h-16 sm:w-16">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
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
          <div className="text-[10px] uppercase tracking-[0.2em] text-blue-300/70 sm:text-[11px]">
            BTS dashboard
          </div>

          <div className="mt-1 truncate text-sm font-medium text-neutral-400 sm:text-[15px]">
            {displayName}
          </div>

          <div className="mt-1 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-neutral-300 sm:text-[10px]">
            {providerLabel}
          </div>

          <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.04em] text-white sm:mt-4 sm:text-[36px]">
            {greeting}
          </h1>

          <p className="mt-2 max-w-[42rem] text-[13px] leading-6 text-neutral-400 sm:mt-3 sm:text-[15px] sm:leading-7">
            {isFirstTimeUser
              ? "You’re all set. Start with the featured competition, explore the rooms, and build your first result."
              : "Start with the featured competition, jump into rooms, check the weekly standings, or head straight to your profile."}
          </p>
        </div>
      </div>
    </div>
  );
}

function PulseCard({
  to,
  eyebrow,
  title,
  description,
  accent = "blue",
  cta = "View",
}) {
  const accentClasses =
    accent === "violet"
      ? "border-violet-400/18 bg-violet-500/10"
      : accent === "emerald"
      ? "border-emerald-400/18 bg-emerald-500/10"
      : "border-blue-400/18 bg-blue-500/10";

  return (
    <Link
      to={to}
      className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-3.5 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.038),rgba(255,255,255,0.018))] sm:rounded-[20px] sm:p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          {eyebrow}
        </div>
        <div
          className={`rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] ${accentClasses}`}
        >
          {cta}
        </div>
      </div>

      <div className="mt-2.5 text-[20px] font-semibold tracking-[-0.04em] text-white sm:text-[22px]">
        {title}
      </div>

      <div className="mt-1.5 text-[12px] leading-5 text-neutral-400 sm:text-[13px] sm:leading-6">
        {description}
      </div>
    </Link>
  );
}

function NextMoveRow({
  step,
  title,
  description,
  to,
  actionLabel,
  accent = "blue",
}) {
  const accentClasses =
    accent === "violet"
      ? "border-violet-400/18 bg-violet-500/10 text-violet-200"
      : accent === "emerald"
      ? "border-emerald-400/18 bg-emerald-500/10 text-emerald-200"
      : "border-blue-400/18 bg-blue-500/10 text-blue-200";

  return (
    <div className="rounded-[14px] border border-white/8 bg-black/20 px-3 py-2.5 sm:rounded-[16px] sm:px-3.5 sm:py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
            {step}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-white sm:text-sm">
            {title}
          </div>
          <div className="mt-1 text-[11px] leading-5 text-neutral-400 sm:text-[12px]">
            {description}
          </div>
        </div>

        <Link
          to={to}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] transition hover:opacity-90 ${accentClasses}`}
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}

function NextUpCard({ isFirstTimeUser, featuredRoom }) {
  const featuredLink = featuredRoom ? `/rooms/${featuredRoom.id}` : "/rooms";

  return (
    <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.012))] p-3.5 sm:rounded-[24px] sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Next up
          </div>
          <div className="mt-1.5 text-[15px] font-semibold tracking-[-0.03em] text-white sm:text-[17px]">
            {isFirstTimeUser ? "Your first 3 moves" : "Keep momentum going"}
          </div>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-neutral-300">
          Quick
        </div>
      </div>

      <div className="mt-2 text-[12px] leading-5 text-neutral-400 sm:text-[13px]">
        {isFirstTimeUser
          ? "Start cleanly and let the app begin to populate around your activity."
          : "Use the dashboard as a control point, then move straight into what matters."}
      </div>

      <div className="mt-3 space-y-2.5">
        {isFirstTimeUser ? (
          <>
            <NextMoveRow
              step="Step 1"
              title="Enter the featured room"
              description="Play your first round and start building history."
              to={featuredLink}
              actionLabel="Play"
              accent="blue"
            />
            <NextMoveRow
              step="Step 2"
              title="Check live standings"
              description="See how the weekly competition is moving."
              to="/leaderboards?mode=combined&period=current"
              actionLabel="View"
              accent="violet"
            />
            <NextMoveRow
              step="Step 3"
              title="Complete your profile"
              description="Set your display name and account details."
              to="/profile"
              actionLabel="Edit"
              accent="emerald"
            />
          </>
        ) : (
          <>
            <NextMoveRow
              step="Play"
              title="Jump back into competition"
              description="Use the featured room for the fastest return to live play."
              to={featuredLink}
              actionLabel="Open"
              accent="blue"
            />
            <NextMoveRow
              step="Track"
              title="Review your recent activity"
              description="Open your activity page to check recent results."
              to="/activity"
              actionLabel="Review"
              accent="violet"
            />
            <NextMoveRow
              step="Compare"
              title="Check where you stand"
              description="See your place in the current rankings this week."
              to="/leaderboards?mode=combined&period=current"
              actionLabel="Compare"
              accent="emerald"
            />
          </>
        )}
      </div>
    </div>
  );
}

// function MentionSummaryCard({ roomsWithUnreadMentions, totalUnreadMentions }) {
//   if (totalUnreadMentions <= 0) return null;

//   const priorityRoom = roomsWithUnreadMentions[0] || null;

//   return (
//     <div className="mb-5 rounded-[20px] border border-amber-400/18 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_38%),linear-gradient(180deg,rgba(245,158,11,0.1),rgba(245,158,11,0.04))] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.12)] sm:mb-6 sm:rounded-[24px] sm:p-5">
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div>
//           <div className="text-[10px] uppercase tracking-[0.18em] text-amber-200/80 sm:text-[11px]">
//             Mentions waiting
//           </div>
//           <div className="mt-1 text-[16px] font-semibold tracking-[-0.03em] text-white sm:text-[18px]">
//             You have {formatMentionCount(totalUnreadMentions)} waiting across{" "}
//             {roomsWithUnreadMentions.length} room
//             {roomsWithUnreadMentions.length === 1 ? "" : "s"}.
//           </div>
//           <div className="mt-1.5 text-[12px] leading-5 text-amber-50/80 sm:text-[13px]">
//             Open a room to clear its unread mentions.
//           </div>
//         </div>

//         <div className="flex flex-wrap gap-2">
//           {priorityRoom ? (
//             <Link
//               to={`/rooms/${priorityRoom.id}`}
//               className="inline-flex items-center gap-2 rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-amber-300/14 sm:px-4 sm:py-2 sm:text-sm"
//             >
//               Open latest mention
//               <span aria-hidden="true">→</span>
//             </Link>
//           ) : null}

//           <Link
//             to="/rooms"
//             className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-white/15 hover:bg-white/[0.06] sm:px-4 sm:py-2 sm:text-sm"
//           >
//             View rooms
//             <span aria-hidden="true">→</span>
//           </Link>
//         </div>
//       </div>

//       <div className="mt-3 flex flex-wrap gap-2">
//         {roomsWithUnreadMentions.slice(0, 3).map((room) => (
//           <Link
//             key={room.id}
//             to={`/rooms/${room.id}`}
//             className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-white transition hover:bg-black/30"
//           >
//             <span className="truncate">{room.name}</span>
//             <span className="rounded-full border border-amber-300/18 bg-amber-300/10 px-2 py-0.5 text-[10px] font-medium text-amber-100">
//               {room.unreadMentionCount}
//             </span>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// }

export default function LobbyPage() {
  const { user } = useAuth();
  const { syncRoomsFromPayload, mergeRooms } = useMentions();

  const [rawRooms, setRawRooms] = useState([]);
  const [featuredRoomStatus, setFeaturedRoomStatus] = useState(null);
  const [sessionPodium, setSessionPodium] = useState(null);
  const [currentLeaders, setCurrentLeaders] = useState([]);
  const [wordScrambleLeaders, setWordScrambleLeaders] = useState([]);
  const [combinedBoardRows, setCombinedBoardRows] = useState([]);
  const [profileOverview, setProfileOverview] = useState(null);
  const [recentResult, setRecentResult] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadMentions, setUnreadMentions] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setError("");
      setIsLoading(true);

      try {
        const [roomsData, mentionsData] = await Promise.all([
          getRooms(),
          getUnreadMentions(8).catch(() => []),
        ]);
        if (!isMounted) return;



        const nextRooms = Array.isArray(roomsData) ? roomsData : [];
        setRawRooms(nextRooms);
        syncRoomsFromPayload(nextRooms);

        setUnreadMentions(Array.isArray(mentionsData) ? mentionsData : []);

        const battleTriviaRoom =
          nextRooms.find((room) => room.slug === "battle-trivia") ||
          nextRooms.find((room) => room.roomType === "trivia") ||
          null;

        const [
          status,
          podium,
          leaders,
          scrambleBoard,
          combinedBoard,
          profileData,
          historyData,
        ] = await Promise.all([
          battleTriviaRoom
            ? getRoomSessionStatus(battleTriviaRoom.id).catch(() => null)
            : Promise.resolve(null),
          getBattleTriviaSessionPodium().catch(() => null),
          getCurrentBattleTriviaLeaderboard(3).catch(() => []),
          getLeaderboard("word-scramble", "current", 3).catch(() => ({
            rows: [],
          })),
          getLeaderboard("combined", "current", 100).catch(() => ({
            rows: [],
          })),
          getMyProfile().catch(() => null),
          getMyProfileHistory(1, 1).catch(() => ({
            items: [],
          })),
        ]);

        if (!isMounted) return;

        setFeaturedRoomStatus(status || null);
        setSessionPodium(podium || null);
        setCurrentLeaders(Array.isArray(leaders) ? leaders : []);
        setWordScrambleLeaders(
          Array.isArray(scrambleBoard?.rows) ? scrambleBoard.rows : []
        );
        setCombinedBoardRows(
          Array.isArray(combinedBoard?.rows) ? combinedBoard.rows : []
        );
        setProfileOverview(profileData || null);
        setRecentResult(
          Array.isArray(historyData?.items) ? historyData.items[0] || null : null
        );
      } catch {
        if (!isMounted) return;
        setError("Failed to load dashboard.");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [syncRoomsFromPayload]);

  const rooms = useMemo(() => mergeRooms(rawRooms), [rawRooms, mergeRooms]);

  const featuredRoom = useMemo(() => {
    const baseRoom =
      rooms.find((room) => room.slug === "battle-trivia") ||
      rooms.find((room) => room.roomType === "trivia") ||
      null;

    if (!baseRoom) return null;

    return {
      ...baseRoom,
      sessionStatus: featuredRoomStatus,
    };
  }, [rooms, featuredRoomStatus]);

  // const roomsWithUnreadMentions = useMemo(() => {
  //   return [...rooms]
  //     .filter((room) => (Number(room?.unreadMentionCount) || 0) > 0)
  //     .sort(
  //       (a, b) =>
  //         (Number(b?.unreadMentionCount) || 0) -
  //         (Number(a?.unreadMentionCount) || 0)
  //     );
  // }, [rooms]);

  // const totalUnreadMentions = useMemo(() => {
  //   return roomsWithUnreadMentions.reduce(
  //     (sum, room) => sum + (Number(room?.unreadMentionCount) || 0),
  //     0
  //   );
  // }, [roomsWithUnreadMentions]);

  const showPodium =
    !!sessionPodium?.hasPodium && sessionPodium?.winners?.length > 0;
  const showCurrentLeaders = !showPodium && currentLeaders.length > 0;

  const battleTriviaPreviewRows = showPodium
    ? sessionPodium?.winners || []
    : currentLeaders;

  const battleTriviaPreviewSubtitle = showPodium
    ? `Latest winners · ${formatEndedAt(sessionPodium?.endedAt)}`
    : "Current week · Top 3";

  const combinedLeadersPreview = useMemo(
    () => combinedBoardRows.slice(0, 3),
    [combinedBoardRows]
  );

  const currentStanding = useMemo(() => {
    if (!user?.id) return null;
    return combinedBoardRows.find((row) => row.userId === user.id) || null;
  }, [combinedBoardRows, user?.id]);

  const totalCorrectAnswers = profileOverview?.stats?.totalCorrectAnswers ?? 0;
  const bestStreak = profileOverview?.stats?.bestStreak ?? 0;

  const isFirstTimeUser =
    !recentResult &&
    !currentStanding &&
    bestStreak === 0 &&
    totalCorrectAnswers === 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 pb-24 sm:px-5 sm:py-7 sm:pb-7 lg:px-6 lg:py-9">
        <AppSectionNav />
        <DashboardHero user={user} isFirstTimeUser={isFirstTimeUser} />

        <MentionInboxCard
          title="Unread mentions"
          description="Open a mention and jump into the exact message instead of just clearing a room badge."
          items={unreadMentions}
        />
        {/* <MentionSummaryCard
          roomsWithUnreadMentions={roomsWithUnreadMentions}
          totalUnreadMentions={totalUnreadMentions}
        /> */}

        {error ? (
          <div className="mb-5 rounded-[20px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90 sm:mb-6 sm:rounded-[22px]">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500 sm:rounded-[24px] sm:py-12">
            Loading dashboard...
          </div>
        ) : (
          <>
            <section className="mb-7 sm:mb-9">
              <SectionHeader
                eyebrow="Personal"
                title={isFirstTimeUser ? "Getting started" : "Your snapshot"}
                description={
                  isFirstTimeUser
                    ? "A cleaner first-time experience: start playing, complete your profile, and watch your results appear here."
                    : "A quick pulse on your recent result, streak, and current standing."
                }
              />

              <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
                {isFirstTimeUser ? (
                  <>
                    <PulseCard
                      to={featuredRoom ? `/rooms/${featuredRoom.id}` : "/rooms"}
                      eyebrow="Step 1"
                      title="Play your first round"
                      description="Enter the featured room and answer a few questions to start building history."
                      accent="blue"
                      cta="Start"
                    />

                    <PulseCard
                      to="/rooms"
                      eyebrow="Step 2"
                      title="Explore game rooms"
                      description="Browse the competitive spaces and find the rooms you want to return to."
                      accent="violet"
                      cta="Browse"
                    />

                    <PulseCard
                      to="/profile"
                      eyebrow="Step 3"
                      title="Finish your profile"
                      description="Update your display name and account details so the app feels more personal."
                      accent="emerald"
                      cta="Edit"
                    />
                  </>
                ) : (
                  <>
                    <PulseCard
                      to="/activity"
                      eyebrow="Recent result"
                      title={
                        recentResult
                          ? `#${recentResult.rank} · ${recentResult.score} pts`
                          : "No result yet"
                      }
                      description={
                        recentResult
                          ? `${recentResult.title || "Battle Trivia"} · ${formatShortDate(
                              recentResult.endedAt
                            )}`
                          : "Jump into the featured room to start building your history."
                      }
                      accent="blue"
                    />

                    <PulseCard
                      to="/profile"
                      eyebrow="Best streak"
                      title={`x${bestStreak}`}
                      description={
                        bestStreak > 0
                          ? "Your all-time best answer streak."
                          : "No streak recorded yet — start a run and build momentum."
                      }
                      accent="violet"
                    />

                    <PulseCard
                      to="/leaderboards?mode=combined&period=current"
                      eyebrow="Current standing"
                      title={currentStanding ? `#${currentStanding.rank}` : "Unranked"}
                      description={
                        currentStanding
                          ? `${currentStanding.score} pts in the current combined standings.`
                          : "You are not placed in the current combined standings yet."
                      }
                      accent="emerald"
                    />
                  </>
                )}
              </div>
            </section>

            {featuredRoom ? (
              <section className="mb-6 sm:mb-8">
                <SectionHeader
                  eyebrow="Featured"
                  title="Main competition"
                  description="The headline room and fastest way into the live action."
                />

                <FeaturedTriviaCard room={featuredRoom} />

                {showPodium ? (
                  <LeadersPanel
                    title="Latest Battle Trivia winners"
                    subtitle={formatEndedAt(sessionPodium.endedAt)}
                    entries={sessionPodium.winners}
                  />
                ) : showCurrentLeaders ? (
                  <LeadersPanel
                    title="Current Battle Trivia leaders"
                    subtitle="Live standings for this week"
                    entries={currentLeaders}
                  />
                ) : null}
              </section>
            ) : null}

            <section className="mb-7 sm:mb-9">
              <SectionHeader
                eyebrow="Explore"
                title="Go where you need to go"
                description="Keep the dashboard short and move into dedicated sections."
              />

              <div className="grid gap-3 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <QuickDestinationCard
                    to="/rooms"
                    eyebrow="Rooms"
                    title="Game rooms"
                    description="Battle Trivia, Word Scramble, and other competitive spaces."
                  />

                  <QuickDestinationCard
                    to="/community"
                    eyebrow="Community"
                    title="Community spaces"
                    description="General chat rooms and social spaces outside competition."
                  />
                </div>

                <NextUpCard
                  isFirstTimeUser={isFirstTimeUser}
                  featuredRoom={featuredRoom}
                />
              </div>
            </section>

            <section>
              <SectionHeader
                eyebrow="Standings"
                title="Quick leaderboard snapshot"
                description="A lightweight preview. Open the leaderboard page for the full picture."
              />

              <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
                <LeaderboardPreviewCard
                  title="Battle Trivia"
                  subtitle={battleTriviaPreviewSubtitle}
                  rows={battleTriviaPreviewRows}
                  to="/leaderboards?mode=battle-trivia&period=current"
                  accent="blue"
                />

                <LeaderboardPreviewCard
                  title="Word Scramble"
                  subtitle="Current week · Top 3"
                  rows={wordScrambleLeaders}
                  to="/leaderboards?mode=word-scramble&period=current"
                  accent="violet"
                />

                <LeaderboardPreviewCard
                  title="Combined"
                  subtitle="Trivia + Scramble · Current week"
                  rows={combinedLeadersPreview}
                  to="/leaderboards?mode=combined&period=current"
                  accent="blue"
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}