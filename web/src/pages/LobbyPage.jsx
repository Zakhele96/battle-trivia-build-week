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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
          {eyebrow}
        </div>
        <div className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white">
          {title}
        </div>
        {description ? (
          <div className="mt-2 text-sm text-neutral-400">{description}</div>
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
      className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4 transition hover:border-white/15 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))]"
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        {eyebrow}
      </div>
      <div className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
        {title}
      </div>
      <div className="mt-2 text-sm leading-6 text-neutral-400">
        {description}
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-blue-300/80">
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
      className={`rounded-[18px] border p-3.5 ${
        isChampion
          ? "border-amber-400/20 bg-amber-500/10"
          : "border-white/8 bg-black/20"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
            isChampion
              ? "bg-amber-400/15 text-amber-200"
              : "bg-white/[0.05] text-neutral-400"
          }`}
        >
          #{entry.rank}
        </span>

        {isChampion ? <span aria-hidden="true">👑</span> : null}
      </div>

      <div className="mt-3 truncate text-sm font-semibold text-white">
        {entry.displayName || entry.username}
      </div>

      <div className="mt-1 text-[11px] text-neutral-500">
        @{entry.username}
      </div>

      <div
        className={`mt-3 text-sm font-semibold ${
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
    <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            {title}
          </div>
          <div className="mt-1 text-sm text-neutral-300">{subtitle}</div>
        </div>

        <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
          Top {entries.length}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {entries.map((entry) => (
          <LeaderCard key={`${entry.userId}-${entry.rank}`} entry={entry} />
        ))}
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
      <div className="mx-auto w-full max-w-[76rem] px-4 py-5 sm:px-5 sm:py-7 lg:px-6 lg:py-9">
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
              label: "Leaderboards",
              sublabel: "Weekly standings",
            },
          ]}
        />

        {error ? (
          <div className="mb-6 rounded-[22px] border border-red-900/35 bg-red-950/25 px-4 py-3 text-sm text-red-300/90">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-12 text-center text-sm text-neutral-500">
            Loading rooms...
          </div>
        ) : (
          <>
            <section className="mb-8 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.16)]">
                <div className="text-[11px] uppercase tracking-[0.22em] text-blue-300/70">
                  Live now
                </div>
                <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[34px]">
                  The cleanest way into the action
                </h2>
                <p className="mt-3 max-w-[40rem] text-sm leading-7 text-neutral-400 sm:text-[15px]">
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
              <section className="mb-10">
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
                  <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                      Weekly podium
                    </div>
                    <div className="mt-2 text-sm text-neutral-400">
                      This week’s champions will appear here when the session
                      ends.
                    </div>
                  </div>
                )}
              </section>
            ) : null}

            <section className="mb-10">
              <SectionHeader
                eyebrow="Rooms"
                title="Game rooms"
                description="Focused spaces for competitive play and structured game sessions."
              />

              {gameRooms.length === 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-12 text-center text-sm text-neutral-500">
                  No game rooms available yet.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {gameRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              )}
            </section>

            <section className="mb-10">
              <SectionHeader
                eyebrow="Rooms"
                title="Community spaces"
                description="General hangout rooms and non-competitive spaces."
              />

              {communityRooms.length === 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-12 text-center text-sm text-neutral-500">
                  No community rooms available yet.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                    className="inline-flex items-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-white transition hover:border-white/15 hover:bg-white/[0.05]"
                  >
                    Open full page
                    <span aria-hidden="true">→</span>
                  </Link>
                }
              />

              <div className="grid gap-4 lg:grid-cols-3">
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