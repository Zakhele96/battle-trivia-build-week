import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FeaturedTriviaCard from "../components/lobby/FeaturedTriviaCard";
import LeaderboardPreviewCard from "../components/lobby/LeaderboardPreviewCard";
import RoomCard from "../components/lobby/RoomCard";
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

  const showPodium =
    !!sessionPodium?.hasPodium && sessionPodium?.winners?.length > 0;
  const showCurrentLeaders = !showPodium && currentLeaders.length > 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-[76rem] px-4 py-5 sm:px-5 sm:py-7 lg:px-6 lg:py-9">
        <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-blue-300/70">
              BTS
            </div>

            <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.04em] text-white sm:text-[34px] lg:text-[38px]">
              Enter the live experience
            </h1>

            <p className="mt-3 max-w-[40rem] text-sm leading-7 text-neutral-400 sm:text-[15px]">
              Choose a room, join the conversation, and jump straight into
              Battle Trivia when the room is hot.
            </p>
          </div>

          <Link
            to="/profile"
            className="w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.14)] transition hover:border-blue-400/20 hover:bg-white/[0.05] sm:w-auto sm:min-w-[13rem] sm:text-right"
          >
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Profile
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              {user?.displayName || user?.username || "Player"}
            </div>
            <div className="mt-1 text-[11px] text-blue-300/80">
              Open account →
            </div>
          </Link>
        </div>

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
            {featuredRoom ? (
              <section>
                <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                  Featured room
                </div>

                <FeaturedTriviaCard room={featuredRoom} />

                {showPodium ? (
                  <LeadersPanel
                    title="Weekly podium"
                    subtitle={formatEndedAt(sessionPodium.endedAt)}
                    entries={sessionPodium.winners}
                  />
                ) : showCurrentLeaders ? (
                  <LeadersPanel
                    title="Current weekly leaders"
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

            <section className="mt-8">
              <div className="mb-5">
                <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                  Weekly leaderboards
                </div>
                <div className="mt-1 text-sm text-neutral-400">
                  Track the top players across Word Scramble and combined weekly
                  standings.
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
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

            <section className="mt-8 sm:mt-10">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                    All rooms
                  </div>
                  <div className="mt-1 text-sm text-neutral-400">
                    Choose where you want to hang out live.
                  </div>
                </div>

                <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                  {regularRooms.length} room
                  {regularRooms.length === 1 ? "" : "s"}
                </div>
              </div>

              {regularRooms.length === 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-12 text-center text-sm text-neutral-500">
                  No additional rooms available yet.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {regularRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}