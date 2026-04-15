import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FeaturedTriviaCard from "../components/lobby/FeaturedTriviaCard";
import LeaderboardPreviewCard from "../components/lobby/LeaderboardPreviewCard";
import RoomCard from "../components/lobby/RoomCard";
import AppTopBar from "../components/layout/AppTopBar";
import {
  getBattleTriviaSessionPodium,
  getCurrentBattleTriviaLeaderboard,
  getRoomSessionStatus,
  getRooms,
} from "../api/roomsApi";
import { getLeaderboard } from "../api/leaderboardsApi";
import { useAuth } from "../hooks/useAuth";

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

function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 sm:text-[11px]">
          {eyebrow}
        </div>
        <div className="mt-1 text-[17px] font-semibold tracking-[-0.03em] text-white sm:text-xl">
          {title}
        </div>
        {description ? (
          <div className="mt-1.5 text-[13px] text-neutral-400 sm:mt-2 sm:text-sm">
            {description}
          </div>
        ) : null}
      </div>

      {action ? action : null}
    </div>
  );
}

function QuickLinkCard({ to, eyebrow, title, description }) {
  return (
    <Link
      to={to}
      className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-3.5 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] sm:p-4"
    >
      <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[10px]">
        {eyebrow}
      </div>
      <div className="mt-2 text-[15px] font-semibold tracking-[-0.03em] text-white sm:text-lg">
        {title}
      </div>
      <div className="mt-1.5 text-[13px] leading-5 text-neutral-400 sm:mt-2 sm:text-sm sm:leading-6">
        {description}
      </div>
      <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-blue-300/80 sm:mt-4 sm:text-[11px]">
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
    <div className="mt-3.5 rounded-[20px] border border-white/10 bg-white/[0.03] p-3.5 sm:mt-4 sm:rounded-[22px] sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
            {title}
          </div>
          <div className="mt-1 text-[13px] text-neutral-300 sm:text-sm">
            {subtitle}
          </div>
        </div>

        <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-neutral-400 sm:text-[10px]">
          Top {entries.length}
        </div>
      </div>

      <div className="mt-3.5 grid gap-2.5 sm:mt-4 sm:grid-cols-3 sm:gap-3">
        {entries.map((entry) => (
          <LeaderCard key={`${entry.userId}-${entry.rank}`} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function MobileEntryStrip({ featuredRoom }) {
  return (
    <div className="mb-5 sm:hidden">
      <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-3.5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-blue-300/70">
          Jump in
        </div>

        <div className="mt-2 text-[17px] font-semibold tracking-[-0.03em] text-white">
          Choose where you want to go
        </div>

        <div className="mt-1.5 text-[13px] leading-5 text-neutral-400">
          Go straight to the featured room or open weekly standings.
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {featuredRoom ? (
            <Link
              to={`/rooms/${featuredRoom.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)] px-4 py-2 text-[12px] font-semibold text-white"
            >
              Featured room
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}

          <Link
            to="/leaderboards?mode=combined&period=current"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[12px] font-semibold text-white"
          >
            Standings
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LobbyPage() {
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [featuredRoomStatus, setFeaturedRoomStatus] = useState(null);
  const [sessionPodium, setSessionPodium] = useState(null);
  const [currentLeaders, setCurrentLeaders] = useState([]);
  const [wordScrambleLeaders, setWordScrambleLeaders] = useState([]);
  const [combinedLeaders, setCombinedLeaders] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadRooms() {
      setError("");
      setIsLoading(true);
      setFeaturedRoomStatus(null);
      setSessionPodium(null);
      setCurrentLeaders([]);
      setWordScrambleLeaders([]);
      setCombinedLeaders([]);

      try {
        const data = await getRooms();
        if (!isMounted) return;

        const nextRooms = Array.isArray(data) ? data : [];
        setRooms(nextRooms);

        const battleTriviaRoom =
          nextRooms.find((room) => room.slug === "battle-trivia") ||
          nextRooms.find((room) => room.roomType === "trivia") ||
          null;

        const tasks = [
          battleTriviaRoom
            ? getRoomSessionStatus(battleTriviaRoom.id).catch(() => null)
            : Promise.resolve(null),
          getBattleTriviaSessionPodium().catch(() => null),
          getCurrentBattleTriviaLeaderboard(3).catch(() => []),
          getLeaderboard("word-scramble", "current", 3).catch(() => ({
            rows: [],
          })),
          getLeaderboard("combined", "current", 3).catch(() => ({
            rows: [],
          })),
        ];

        const [status, podium, leaders, scrambleBoard, combinedBoard] =
          await Promise.all(tasks);

        if (!isMounted) return;

        setFeaturedRoomStatus(status || null);
        setSessionPodium(podium || null);
        setCurrentLeaders(Array.isArray(leaders) ? leaders : []);
        setWordScrambleLeaders(
          Array.isArray(scrambleBoard?.rows) ? scrambleBoard.rows : []
        );
        setCombinedLeaders(
          Array.isArray(combinedBoard?.rows) ? combinedBoard.rows : []
        );
      } catch {
        if (!isMounted) return;
        setError("Failed to load rooms.");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    loadRooms();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const regularRooms = useMemo(() => {
    if (!featuredRoom) return rooms;
    return rooms.filter((room) => room.id !== featuredRoom.id);
  }, [rooms, featuredRoom]);

  const gameRooms = useMemo(
    () =>
      regularRooms.filter(
        (room) =>
          room.roomType === "game" ||
          room.roomType === "trivia" ||
          room.slug === "word-scramble"
      ),
    [regularRooms]
  );

  const communityRooms = useMemo(
    () =>
      regularRooms.filter(
        (room) =>
          !(
            room.roomType === "game" ||
            room.roomType === "trivia" ||
            room.slug === "word-scramble"
          )
      ),
    [regularRooms]
  );

  const showPodium =
    !!sessionPodium?.hasPodium && sessionPodium?.winners?.length > 0;
  const showCurrentLeaders = !showPodium && currentLeaders.length > 0;

  const battleTriviaPreviewRows = showPodium
    ? sessionPodium?.winners || []
    : currentLeaders;

  const battleTriviaPreviewSubtitle = showPodium
    ? `Latest winners · ${formatEndedAt(sessionPodium?.endedAt)}`
    : "Current week · Top 3";

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-[76rem] px-4 py-4 sm:px-5 sm:py-7 lg:px-6 lg:py-9">
        <AppTopBar
          eyebrow="BTS"
          title={`Welcome${user?.displayName ? `, ${user.displayName}` : ""}`}
          description="Choose the right place to jump in: featured competition, game rooms, community chat, or weekly standings."
          showBackToLobby={false}
          actions={[
            {
              to: "/profile",
              label: "Profile",
              sublabel: user?.username || "Manage account",
            },
            {
              to: "/leaderboards?mode=combined&period=current",
              label: "Standings",
              sublabel: "Weekly standings",
            },
          ]}
        />

        {error ? (
          <div className="mb-5 rounded-[20px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90 sm:mb-6 sm:rounded-[22px]">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500 sm:rounded-[24px] sm:py-12">
            Loading rooms...
          </div>
        ) : (
          <>
            <MobileEntryStrip featuredRoom={featuredRoom} />

            <section className="mb-6 hidden gap-4 lg:mb-8 sm:grid lg:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.16)]">
                <div className="text-[11px] uppercase tracking-[0.22em] text-blue-300/70">
                  Live now
                </div>
                <h2 className="mt-3 text-[34px] font-semibold tracking-[-0.04em] text-white">
                  The cleanest way into the action
                </h2>
                <p className="mt-3 max-w-[40rem] text-[15px] leading-7 text-neutral-400">
                  Start with the featured room if you want live competition, or
                  head straight into game and community spaces below.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  {featuredRoom ? (
                    <Link
                      to={`/rooms/${featuredRoom.id}`}
                      className="inline-flex items-center gap-2 rounded-[18px] bg-[linear-gradient(180deg,rgba(64,156,255,1)_0%,rgba(10,132,255,1)_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(37,99,235,0.28)]"
                    >
                      Enter featured room
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : null}

                  <Link
                    to="/leaderboards?mode=combined&period=current"
                    className="inline-flex items-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/15 hover:bg-white/[0.06]"
                  >
                    View standings
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <QuickLinkCard
                  to="/profile"
                  eyebrow="Your account"
                  title="Profile and progress"
                  description="Update your details, review your stats, and track achievements."
                />
                <QuickLinkCard
                  to="/leaderboards?mode=combined&period=current"
                  eyebrow="Competition"
                  title="Weekly standings"
                  description="Check Battle Trivia, Word Scramble, and combined rankings."
                />
              </div>
            </section>

            {featuredRoom ? (
              <section className="mb-8 sm:mb-10">
                <SectionHeader
                  eyebrow="Featured"
                  title="Main competition"
                  description="This is the headline room and the primary destination when live play is happening."
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
                ) : (
                  <div className="mt-3.5 rounded-[20px] border border-white/10 bg-white/[0.03] p-3.5 sm:mt-4 sm:rounded-[22px] sm:p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
                      Weekly podium
                    </div>
                    <div className="mt-2 text-[13px] text-neutral-400 sm:text-sm">
                      This week’s champions will appear here when the session
                      ends.
                    </div>
                  </div>
                )}
              </section>
            ) : null}

            <section className="mb-8 sm:mb-10">
              <SectionHeader
                eyebrow="Rooms"
                title="Game rooms"
                description="Focused spaces for competitive play and structured game sessions."
              />

              {gameRooms.length === 0 ? (
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500 sm:rounded-[24px] sm:py-12">
                  No game rooms available yet.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {gameRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              )}
            </section>

            <section className="mb-8 sm:mb-10">
              <SectionHeader
                eyebrow="Rooms"
                title="Community spaces"
                description="General hangout rooms and non-competitive spaces."
              />

              {communityRooms.length === 0 ? (
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-neutral-500 sm:rounded-[24px] sm:py-12">
                  No community rooms available yet.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {communityRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionHeader
                eyebrow="Standings"
                title="Weekly leaderboard hub"
                description="Competition lives here, not between room sections."
                action={
                  <Link
                    to="/leaderboards?mode=combined&period=current"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 text-[12px] font-medium text-white transition hover:border-white/15 hover:bg-white/[0.05] sm:rounded-[18px] sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    Open full page
                    <span aria-hidden="true">→</span>
                  </Link>
                }
              />

              <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
                <LeaderboardPreviewCard
                  title="Battle Trivia"
                  subtitle={battleTriviaPreviewSubtitle}
                  rows={battleTriviaPreviewRows}
                  to="/leaderboards?mode=battle-trivia&period=current"
                  accent="amber"
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
                  rows={combinedLeaders}
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